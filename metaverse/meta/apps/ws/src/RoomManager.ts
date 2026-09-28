import type { User } from "./User";
import type { OutgoingMessage } from "./types";

export class RoomManager {
  private static instance: RoomManager;
  readonly rooms = new Map<string, Set<User>>();

  private constructor() {}

  static getInstance(): RoomManager {
    return (this.instance ??= new RoomManager());
  }

  getRoom(roomId: string): User[] {
    return [...(this.rooms.get(roomId) ?? [])];
  }

  addUser(roomId: string, user: User): void {
    const room = this.rooms.get(roomId) ?? new Set<User>();
    room.add(user);
    this.rooms.set(roomId, room);
  }

  removeUser(user: User, roomId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;
    room.delete(user);
    if (room.size === 0) this.rooms.delete(roomId);
  }

  broadcastToAll(message: OutgoingMessage, roomId: string): void {
    for (const user of this.rooms.get(roomId) ?? []) user.send(message);
  }

  broadcast(message: OutgoingMessage, sender: User, roomId: string): void {
    for (const user of this.rooms.get(roomId) ?? []) if (user !== sender) user.send(message);
  }

  findUserByUserId(userId: string): User | undefined {
    for (const room of this.rooms.values()) {
      for (const user of room) if (user.userId === userId) return user;
    }
    return undefined;
  }
}
