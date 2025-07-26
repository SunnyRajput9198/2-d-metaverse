import { WebSocket } from "ws";
import { RoomManager } from "./RoomManager";
import { OutgoingMessage } from "./types";
import client from "@repo/db"; //isko tsconfig me jake base.config se match kiya moduleResolution and moduleDetection and module add krke and then root folder(cd ..) me jake npm install folowed by npm run build
//isko tsconfig me jake base.config se match kiya moduleResolution and moduleDetection and module add krke and then root folder(cd ..) me jake npm install folowed by npm run build
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_PASSWORD } from "./config";
import { GoogleGenAI } from "@google/genai";

function getRandomString(length: number) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function getAIResponse(prompt: string): Promise<string> {
  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ parts: [{ text: prompt }] }],
    });
    return (
      result.candidates?.[0]?.content?.parts?.[0]?.text ??
      "No response from AI."
    );
  } catch (err) {
    return `Error: ${(err as Error).message}`;
  }
}

export class User {
  public id: string;
  public username?: string;
  public userId?: string;
  private spaceId?: string;
  private x: number;
  private y: number;
  private ws: WebSocket;

  constructor(ws: WebSocket) {
    this.id = getRandomString(10);
    this.x = 0;
    this.y = 0;
    this.ws = ws;
    this.initHandlers();
  }

  initHandlers() {
    this.ws.on("message", async (data) => {
      console.log("data", data);
      const parsedData = JSON.parse(data.toString());
      console.log("parsedData", parsedData);
      switch (parsedData.type) {
        case "join":
          console.log("join receiverdfd ");
          const spaceId = parsedData.payload.spaceId;
          const token = parsedData.payload.token;
          const userId = (jwt.verify(token, JWT_PASSWORD) as JwtPayload).userId;
          if (!userId) {
            this.ws.close();
            return;
          }
          const space = await client.space.findFirst({
            where: {
              id: spaceId,
            },
          });
          const dbUser = await client.user.findUnique({
            where: { id: userId },
          });
          console.log("jouin receiverdfd 2");
          this.userId = userId;
          if (!dbUser) {
            this.ws.close();
            return;
          }
          if (dbUser) {
            this.username = dbUser.username; // assign username fetched from DB
          }

          // console.log("jouin receiverdfd 3");
          if (!space) {
            this.ws.close();
            return;
          }
          // console.log("jouin receiverdfd 4");
          this.spaceId = spaceId;
          console.log("space", space);
          console.log("space id", spaceId);
          // Fetch elements belonging to this space
          const elements = await client.spaceElements.findMany({
            where: { spaceId: spaceId },
            include: {
              element: true,
            },
          });
          console.log("elements", elements);
          console.dir(elements, { depth: null });
          // Build the 2D map grid
          const mapGrid: string[][] = Array.from({ length: space.height }, () =>
            Array.from({ length: space.width }, () => "empty")
          );
          for (const el of elements) {
            if (
              el.x >= 0 &&
              el.x < space.width &&
              el.y >= 0 &&
              el.y < space.height
            ) {
              mapGrid[el.y][el.x] = "element"; // Or use `el.element.id` or a custom label
            }
          }
          RoomManager.getInstance().addUser(spaceId, this);
          this.x = Math.floor(Math.random() * space?.width);
          this.y = Math.floor(Math.random() * space?.height);
          this.send({
            type: "space-joined",
            payload: {
              spawn: {
                x: this.x,
                y: this.y,
              },
              users:
                RoomManager.getInstance()
                  .rooms.get(spaceId)
                  ?.filter((x) => x.id !== this.id)
                  ?.map((u) => ({
                    id: u.id,
                    userId: u.userId,
                    username: u.username,
                    x: u.x,
                    y: u.y,
                    // avatarType: u.avatarType, // (if you add avatars later)
                  })) ?? [],
              dimensions: `${space.width}x${space.height}`, // <<< add this line,
              elements: elements.map((e: any) => ({
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

              map: mapGrid, // <<< Add this!
            },
          });
          console.log("jouin receiverdf 5");
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
          break;
        // 👇 ADD THIS CASE
        case "chat-message":
          if (!this.spaceId || !this.userId) return;
          const messageText = parsedData.payload.message.trim();
          // First, broadcast the user's original message for all to see
          RoomManager.getInstance().broadcastToAll(
            {
              type: "chat-message",
              payload: {
                userId: this.userId,
                message: messageText,
                timestamp: Date.now(),
              },
            },
            this.spaceId
          );
          // Then handle AI commands (separately)
          if (messageText.startsWith("@ai")) {
            const prompt = messageText.substring(3).trim();

            if (prompt.length === 0) {
              this.send({
                type: "chat-message",
                payload: {
                  userId: "ai-bot",
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
                    message:
                      "Error fetching AI response: " + (err as Error).message,
                    timestamp: Date.now(),
                  },
                });
              }
            }
          }
          break;
        case "movement":
          const moveX = parsedData.payload.x;
          const moveY = parsedData.payload.y;
          const xDisplacement = Math.abs(this.x - moveX);
          const yDisplacement = Math.abs(this.y - moveY);
          let direction = "down";
          if (moveX > this.x) direction = "right";
          else if (moveX < this.x) direction = "left";
          else if (moveY > this.y) direction = "down";
          else if (moveY < this.y) direction = "up";
          if (
            (xDisplacement == 1 && yDisplacement == 0) ||
            (xDisplacement == 0 && yDisplacement == 1)
          ) {
            this.x = moveX;
            this.y = moveY;
            RoomManager.getInstance().broadcast(
              {
                type: "movement",
                payload: {
                  userId: this.userId, // ✅ ADD THIS
                  x: this.x,
                  y: this.y,
                  direction: direction, // ✅ send direction
                },
              },
              this,
              this.spaceId!
            );
          } else {
            this.send({
              type: "movement-rejected",
              payload: {
                x: this.x,
                y: this.y,
              },
            });
            break;
          }

        case "video-signal": {
          if (!parsedData.payload || !parsedData.payload.to) return;

          const { from, to, signal } = parsedData.payload;

          // Forward the signal to the target user
          const target = RoomManager.getInstance().findUserByUserId(to);
          if (target) {
            target.send({
              type: "video-signal",
              payload: { from, to, signal },
            });
          }
          break;
        }

        case "start-video": {
          if (!this.spaceId || !this.userId) return;

          RoomManager.getInstance().broadcast(
            {
              type: "start-video",
              payload: { userId: this.userId },
            },
            this, // exclude sender
            this.spaceId
          );
          break;
        }

        case "stop-video": {
          if (!this.spaceId || !this.userId) return;

          RoomManager.getInstance().broadcast(
            {
              type: "stop-video",
              payload: { userId: this.userId },
            },
            this, // exclude sender
            this.spaceId
          );
          break;
        }
        case "emoji-reaction": {
          if (!this.spaceId || !this.userId) return;

          const { emoji } = parsedData.payload;

          RoomManager.getInstance().broadcast(
            {
              type: "emoji-reaction",
              payload: {
                userId: this.userId,
                emoji,
              },
            },
            this, // exclude self (optional)
            this.spaceId
          );

          break;
        }
        case "typing": {
          if (!this.spaceId || !this.userId) return;

          RoomManager.getInstance().broadcast(
            {
              type: "typing",
              payload: {
                userId: this.userId,
              },
            },
            this, // exclude sender
            this.spaceId
          );
          break;
        }
      }
    });
  }

  destroy() {
    RoomManager.getInstance().broadcast(
      {
        type: "user-left",
        payload: {
          userId: this.userId,
        },
      },
      this,
      this.spaceId!
    );
    RoomManager.getInstance().removeUser(this, this.spaceId!);
  }

  send(payload: OutgoingMessage) {
    this.ws.send(JSON.stringify(payload));
  }
}
