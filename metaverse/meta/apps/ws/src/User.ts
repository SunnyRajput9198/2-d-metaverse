import type { RawData, WebSocket } from "ws";
import jwt, { type JwtPayload } from "jsonwebtoken";
import client from "@repo/db";
import { RoomManager } from "./RoomManager";
import type { OutgoingMessage } from "./types";
import { getRandomString } from "./utils/random";
import { getAIResponse } from "./services/ai.service";
import { scheduleCanvasPersistence } from "./services/canvas-state.service";

const MAX_CHAT_LENGTH = 2000;

export class User {
  readonly id = getRandomString(10);
  username?: string;
  userId?: string;
  private spaceId?: string;
  private x = 0;
  private y = 0;
  private width = 0;
  private height = 0;
  private readonly blockedTiles = new Set<string>();
  private joined = false;

  constructor(private readonly ws: WebSocket) {
    ws.on("message", (data) => {
      void this.handleMessage(data).catch((error: unknown) => {
        console.error("WebSocket message failed:", error instanceof Error ? error.message : "unknown error");
        this.send({ type: "error", payload: { message: "Unable to process message" } });
      });
    });
  }

  private async handleMessage(data: RawData): Promise<void> {
    let message: unknown;
    try {
      message = JSON.parse(data.toString());
    } catch {
      this.send({ type: "error", payload: { message: "Message must be valid JSON" } });
      return;
    }
    if (!message || typeof message !== "object" || Array.isArray(message)) {
      this.send({ type: "error", payload: { message: "Message must be an object" } });
      return;
    }
    const { type, payload } = message as { type?: unknown; payload?: unknown };
    if (typeof type !== "string" || !payload || typeof payload !== "object" || Array.isArray(payload)) {
      this.send({ type: "error", payload: { message: "Message must include a type and payload object" } });
      return;
    }
    const body = payload as Record<string, unknown>;
    switch (type) {
      case "join": await this.join(body); break;
      case "movement": this.move(body); break;
      case "chat-message": await this.chat(body); break;
      case "typing": this.typing(); break;
      case "emoji-reaction": this.react(body); break;
      case "shape-update": await this.updateCanvas(body); break;
      default: this.send({ type: "error", payload: { message: "Unknown message type" } });
    }
  }

  private async join(payload: Record<string, unknown>): Promise<void> {
    const secret = process.env.JWT_PASSWORD;
    if (this.joined || !secret || typeof payload.spaceId !== "string" || !payload.spaceId || typeof payload.token !== "string") {
      this.ws.close(1008, "Invalid join request");
      return;
    }
    try {
      const claims = jwt.verify(payload.token, secret, { algorithms: ["HS256"] }) as JwtPayload;
      if (typeof claims.userId !== "string") throw new Error("Invalid token");
      const [dbUser, space] = await Promise.all([
        client.user.findUnique({ where: { id: claims.userId }, select: { id: true, username: true } }),
        client.space.findUnique({ where: { id: payload.spaceId }, select: { id: true, width: true, height: true } }),
      ]);
      if (!dbUser || !space || this.ws.readyState !== this.ws.OPEN) {
        this.ws.close(1008, "Unable to join space");
        return;
      }
      const [spaceElements, canvasState, pastMessages] = await Promise.all([
        client.spaceElements.findMany({ where: { spaceId: space.id }, include: { element: true } }),
        client.canvasState.findUnique({ where: { spaceId: space.id } }),
        client.chatMessage.findMany({
          where: { spaceId: space.id }, orderBy: { timestamp: "desc" }, take: 50,
          select: { userId: true, message: true, timestamp: true, user: { select: { username: true } } },
        }),
      ]);
      this.userId = dbUser.id;
      this.username = dbUser.username;
      this.spaceId = space.id;
      this.width = space.width;
      this.height = space.height;
      const map: string[][] = Array.from({ length: space.height }, () => Array.from({ length: space.width }, () => "empty"));
      for (const element of spaceElements) {
        if (element.x >= 0 && element.x < space.width && element.y >= 0 && element.y < space.height) {
          map[element.y][element.x] = "element";
          this.blockedTiles.add(`${element.x},${element.y}`);
        }
      }
      const openTiles: Array<{ x: number; y: number }> = [];
      for (let y = 0; y < space.height; y++) for (let x = 0; x < space.width; x++) {
        if (!this.blockedTiles.has(`${x},${y}`)) openTiles.push({ x, y });
      }
      const spawn = openTiles[Math.floor(Math.random() * openTiles.length)] ?? { x: 0, y: 0 };
      this.x = spawn.x;
      this.y = spawn.y;
      this.joined = true;
      const room = RoomManager.getInstance();
      const existingUsers = room.getRoom(space.id).filter((user) => user.id !== this.id).map((user) => ({
        id: user.id, userId: user.userId, username: user.username, x: user.x, y: user.y,
      }));
      room.addUser(space.id, this);
      this.send({
        type: "space-joined",
        payload: {
          spawn, users: existingUsers, dimensions: `${space.width}x${space.height}`,
          elements: spaceElements.map((element) => ({
            id: element.id, x: element.x, y: element.y, elementId: element.elementId,
            element: { imageUrl: element.element.imageUrl, width: element.element.width, height: element.element.height },
          })),
          map, excalidrawElements: canvasState?.elements ?? [],
        },
      });
      room.broadcast({ type: "user-joined", payload: { id: this.id, userId: this.userId, username: this.username, x: this.x, y: this.y } }, this, space.id);
      this.send({ type: "chat-history", payload: pastMessages.reverse().map((entry) => ({
        userId: entry.userId, username: entry.user.username, message: entry.message, timestamp: entry.timestamp.getTime(),
      })) });
    } catch (error) {
      console.error("WebSocket join failed:", error instanceof Error ? error.message : "unknown error");
      this.ws.close(1008, "Unable to join space");
    }
  }

  private move(payload: Record<string, unknown>): void {
    if (!this.joined || !this.spaceId || typeof payload.x !== "number" || typeof payload.y !== "number" || !Number.isInteger(payload.x) || !Number.isInteger(payload.y)) return;
    const nextX = payload.x;
    const nextY = payload.y;
    const distance = Math.abs(this.x - nextX) + Math.abs(this.y - nextY);
    if (distance !== 1 || nextX < 0 || nextY < 0 || nextX >= this.width || nextY >= this.height || this.blockedTiles.has(`${nextX},${nextY}`)) {
      this.send({ type: "movement-rejected", payload: { x: this.x, y: this.y, reason: "invalid or blocked movement" } });
      return;
    }
    const direction = nextX > this.x ? "right" : nextX < this.x ? "left" : nextY > this.y ? "down" : "up";
    this.x = nextX;
    this.y = nextY;
    RoomManager.getInstance().broadcast({ type: "movement", payload: { userId: this.userId, x: this.x, y: this.y, direction } }, this, this.spaceId);
  }

  private async chat(payload: Record<string, unknown>): Promise<void> {
    if (!this.joined || !this.spaceId || !this.userId || typeof payload.message !== "string" || payload.message.length > MAX_CHAT_LENGTH) {
      this.send({ type: "error", payload: { message: `Chat messages must be at most ${MAX_CHAT_LENGTH} characters` } });
      return;
    }
    const message = payload.message.trim();
    if (!message) return;
    await client.chatMessage.create({ data: { spaceId: this.spaceId, userId: this.userId, message } });
    const room = RoomManager.getInstance();
    room.broadcastToAll({ type: "chat-message", payload: { userId: this.userId, username: this.username, message, timestamp: Date.now() } }, this.spaceId);
    if (!/^@ai(?:\s|$)/i.test(message)) return;
    const prompt = message.replace(/^@ai\s*/i, "").trim();
    if (!prompt) {
      this.send({ type: "chat-message", payload: { userId: "ai-bot", username: "AI", message: "You must type a prompt after @ai", timestamp: Date.now() } });
      return;
    }
    try {
      const answer = await getAIResponse(prompt);
      room.broadcastToAll({ type: "chat-message", payload: { userId: "ai-bot", username: "AI", message: answer, timestamp: Date.now() } }, this.spaceId);
    } catch (error) {
      console.error("AI response failed:", error instanceof Error ? error.message : "unknown error");
      this.send({ type: "chat-message", payload: { userId: "ai-bot", username: "AI", message: "The AI assistant is temporarily unavailable. Please try again later.", timestamp: Date.now() } });
    }
  }

  private typing(): void {
    if (this.joined && this.spaceId && this.userId) RoomManager.getInstance().broadcast({ type: "typing", payload: { userId: this.userId } }, this, this.spaceId);
  }

  private react(payload: Record<string, unknown>): void {
    if (!this.joined || !this.spaceId || !this.userId || typeof payload.emoji !== "string" || payload.emoji.length < 1 || payload.emoji.length > 16) return;
    RoomManager.getInstance().broadcast({ type: "emoji-reaction", payload: { userId: this.userId, emoji: payload.emoji } }, this, this.spaceId);
  }

  private async updateCanvas(payload: Record<string, unknown>): Promise<void> {
    if (!this.joined || !this.spaceId || !Array.isArray(payload.elements) || payload.elements.length > 2000) {
      this.send({ type: "error", payload: { message: "Canvas update is invalid or too large" } });
      return;
    }
    const elements = payload.elements;
    scheduleCanvasPersistence(this.spaceId, elements);
    RoomManager.getInstance().broadcast({ type: "shape-update", payload: { elements, fromUserId: this.userId, timestamp: Date.now() } }, this, this.spaceId);
  }

  destroy(): void {
    if (!this.joined || !this.spaceId) return;
    this.joined = false;
    const room = RoomManager.getInstance();
    room.broadcast({ type: "user-left", payload: { userId: this.userId } }, this, this.spaceId);
    room.removeUser(this, this.spaceId);
  }

  send(payload: OutgoingMessage): void {
    if (this.ws.readyState === this.ws.OPEN) this.ws.send(JSON.stringify(payload));
  }
}
