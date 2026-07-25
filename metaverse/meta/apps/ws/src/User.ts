import { WebSocket } from "ws";
import { RoomManager } from "./RoomManager";
import { OutgoingMessage } from "./types";
import client from "@repo/db";
import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from 'dotenv';
import { getRandomString } from "./utils/random";
import { getAIResponse } from "./services/openai";
dotenv.config();

const JWT_PASSWORD = process.env.JWT_PASSWORD || "123kasdk123";

export class User {
  public id: string;          // Random generated connection ID
  public username?: string;   // Username fetched from database
  public userId?: string;     // Database user ID (UUID)
  private spaceId?: string;   // Current room/space ID
  private x: number;          // X coordinate in virtual space
  private y: number;          // Y coordinate in virtual space
  private ws: WebSocket;      // WebSocket connection instance

  constructor(ws: WebSocket) {
    this.id = getRandomString(10);
    this.x = 0;
    this.y = 0;
    this.ws = ws;
    this.initHandlers();
  }

  initHandlers() {
    this.ws.on("message", async (data) => {
      const parsedData = JSON.parse(data.toString());
      
      switch (parsedData.type) {
        case "join": {
          try {
          const spaceId = parsedData.payload.spaceId;
          const token = parsedData.payload.token;

          // Verify JWT token and extract user ID
          const userId = (jwt.verify(token, JWT_PASSWORD) as JwtPayload).userId;
          if (!userId) {
            this.ws.close();
            return;
          }

          // Fetch user from database
          const dbUser = await client.user.findUnique({
            where: { id: userId },
          });
          if (!dbUser) {
            this.ws.close();
            return;
          }
          this.userId = userId;
          this.username = dbUser.username;

          // Fetch space details
          const space = await client.space.findFirst({
            where: { id: spaceId },
          });
          if (!space) {
            this.ws.close();
            return;
          }
          this.spaceId = spaceId;

          // Fetch elements (furniture/objects) in the space
          const spaceElementsfromDB = await client.spaceElements.findMany({
            where: { spaceId: spaceId },
            include: { element: true },
          });

          // Build 2D grid map (mark tiles with elements)
          const mapGrid: string[][] = Array.from({ length: space.height }, () =>
            Array.from({ length: space.width }, () => "empty")
          );
          for (const el of spaceElementsfromDB) {
            if (el.x >= 0 && el.x < space.width && el.y >= 0 && el.y < space.height) {
              mapGrid[el.y][el.x] = "element";
            }
          }

          // Fetch canvas state (Excalidraw drawings)
          const canvasState = await client.canvasState.findUnique({
            where: { spaceId: spaceId },
          });

          // Add user to room
          RoomManager.getInstance().addUser(spaceId, this);

          // Random spawn position
          this.x = Math.floor(Math.random() * space.width);
          this.y = Math.floor(Math.random() * space.height);

          // Send space data to user
          this.send({
            type: "space-joined",
            payload: {
              spawn: { x: this.x, y: this.y },
              users: RoomManager.getInstance()
                .rooms.get(spaceId)
                ?.filter((x) => x.id !== this.id)
                ?.map((u) => ({
                  id: u.id,
                  userId: u.userId,
                  username: u.username,
                  x: u.x,
                  y: u.y,
                })) ?? [],
              dimensions: `${space.width}x${space.height}`,
              elements: spaceElementsfromDB.map((e: any) => ({
                id: e.id,
                x: e.x,
                y: e.y,
                elementId: e.elementId,
                element: {
                  imageUrl: e.element.imageUrl,
                  width: e.element.width,
                  height: e.element.height,
                },
              })),
              map: mapGrid,
              excalidrawElements: canvasState?.elements ?? [],
            },
          });

          // Notify other users
          RoomManager.getInstance().broadcast(
            {
              type: "user-joined",
              payload: {
                userId: this.userId,
                username: this.username,
                x: this.x,
                y: this.y,
              },
            },
            this,
            this.spaceId!
          );

          // Send chat history (last 50 messages)
          const pastMessages = await client.chatMessage.findMany({
            where: { spaceId: spaceId },
            orderBy: { timestamp: "asc" },
            take: 50,
            include: { user: true },
          });
          this.send({
            type: "chat-history",
            payload: pastMessages.map((m) => ({
              userId: m.userId,
              username: m.user.username,
              message: m.message,
              timestamp: m.timestamp.getTime(),
            })),
          });
          } catch (err) {
            console.error("Error in join handler:", err);
            this.ws.close();
            return;
          }
          break;
        }

        case "chat-message": {
          if (!this.spaceId || !this.userId) return;

          const messageText = parsedData.payload.message.trim();
          if (!messageText) return;

          // Save message to database
          try {
            await client.chatMessage.create({
              data: {
                spaceId: this.spaceId,
                userId: this.userId,
                message: messageText,
              },
            });
          } catch (error) {
            console.error("Failed to save message:", error);
            return;
          }

          // Broadcast message to all users
          RoomManager.getInstance().broadcastToAll(
            {
              type: "chat-message",
              payload: {
                userId: this.userId,
                username: this.username,
                message: messageText,
                timestamp: Date.now(),
              },
            },
            this.spaceId
          );

          // Handle AI bot commands
          if (messageText.startsWith("@ai")) {
            const prompt = messageText.substring(3).trim();

            if (prompt.length === 0) {
              this.send({
                type: "chat-message",
                payload: {
                  userId: "ai-bot",
                  username: "AI",
                  message: "You must type a prompt after @ai",
                  timestamp: Date.now(),
                },
              });
            } else {
              try {
                const aiResponse = await getAIResponse(prompt);
                RoomManager.getInstance().broadcastToAll(
                  {
                    type: "chat-message",
                    payload: {
                      userId: "ai-bot",
                      username: "AI",
                      message: aiResponse,
                      timestamp: Date.now(),
                    },
                  },
                  this.spaceId
                );
              } catch (err) {
                this.send({
                  type: "chat-message",
                  payload: {
                    userId: "ai-bot",
                    username: "AI",
                    message: "Error fetching AI response: " + (err as Error).message,
                    timestamp: Date.now(),
                  },
                });
              }
            }
          }
          break;
        }

        case "movement": {
          const moveX = parsedData.payload.x;
          const moveY = parsedData.payload.y;

          // Calculate movement distance
          const xDisplacement = Math.abs(this.x - moveX);
          const yDisplacement = Math.abs(this.y - moveY);

          // Determine direction
          let direction = "down";
          if (moveX > this.x) direction = "right";
          else if (moveX < this.x) direction = "left";
          else if (moveY < this.y) direction = "up";
          // moveY > this.y is the default "down" — no branch needed

          // Validate: only 1-tile movement allowed
          if (
            (xDisplacement === 1 && yDisplacement === 0) ||
            (xDisplacement === 0 && yDisplacement === 1)
          ) {
            this.x = moveX;
            this.y = moveY;

            // Broadcast movement to others
            RoomManager.getInstance().broadcast(
              {
                type: "movement",
                payload: {
                  userId: this.userId,
                  x: this.x,
                  y: this.y,
                  direction: direction,
                },
              },
              this,
              this.spaceId!
            );
          } else {
            // Reject invalid movement
            this.send({
              type: "movement-rejected",
              payload: { x: this.x, y: this.y },
            });
          }
          break;
        }

        case "emoji-reaction": {
          if (!this.spaceId || !this.userId) return;

          const { emoji } = parsedData.payload;

          // Broadcast emoji reaction
          RoomManager.getInstance().broadcast(
            {
              type: "emoji-reaction",
              payload: { userId: this.userId, emoji },
            },
            this,
            this.spaceId
          );
          break;
        }

        case "typing": {
          if (!this.spaceId || !this.userId) return;

          // Broadcast typing indicator
          RoomManager.getInstance().broadcast(
            {
              type: "typing",
              payload: { userId: this.userId },
            },
            this,
            this.spaceId
          );
          break;
        }

        case "shape-update": {
          if (!this.spaceId) return;

          const { elements } = parsedData.payload;

          // Validate elements array
          if (!Array.isArray(elements)) {
            console.error("Invalid elements received:", typeof elements);
            return;
          }

          try {
            // Ensure all required fields exist
            const elementsToStore = elements.map((el) => ({
              ...el,
              id: el.id || `element_${Date.now()}_${Math.random()}`,
              versionNonce: el.versionNonce || Date.now(),
              updated: el.updated || Date.now(),
            }));

            // Save canvas state to database
            await client.canvasState.upsert({
              where: { spaceId: this.spaceId },
              update: { elements: elementsToStore },
              create: { spaceId: this.spaceId, elements: elementsToStore },
            });

            // Broadcast to other users (exclude sender to prevent loops)
            RoomManager.getInstance().broadcast(
              {
                type: "shape-update",
                payload: {
                  elements: elementsToStore,
                  fromUserId: this.userId,
                  timestamp: Date.now(),
                },
              },
              this,
              this.spaceId
            );
          } catch (error) {
            console.error("Error handling shape-update:", error);
            this.send({
              type: "shape-update-error",
              payload: {
                error: "Failed to save canvas state",
                message: (error as Error).message,
                timestamp: Date.now(),
              },
            });
          }
          break;
        }
      }
    });
  }

  // Handle user disconnect
  destroy() {
    RoomManager.getInstance().broadcast(
      {
        type: "user-left",
        payload: { userId: this.userId },
      },
      this,// this = The Current User Instance
      this.spaceId!// this.spaceId! = The Space ID the user is in
    );
    RoomManager.getInstance().removeUser(this, this.spaceId!);
  }

  // Send message to this user's WebSocket
  send(payload: OutgoingMessage) {
    this.ws.send(JSON.stringify(payload));
  }
}