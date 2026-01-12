import type { User } from "./User";
import { OutgoingMessage } from "./types";

//RoomManager Class Explanation
// Purpose
// Manages all virtual "rooms" (spaces) and the users in them. It's a singleton (only one instance exists globally).
export class RoomManager {
  rooms: Map<string, User[]> = new Map();
  static instance: RoomManager;

  private constructor() {
    this.rooms = new Map();
  }
// Singleton Pattern Implementation -> it ensures only one instance of RoomManager exists.
  static getInstance() {
    if (!this.instance) {
      this.instance = new RoomManager();
    }
    return this.instance;
  }

  public removeUser(user: User, spaceId: string) {
    if (!this.rooms.has(spaceId)) {
      return;
    }
    this.rooms.set(
      spaceId,
      this.rooms.get(spaceId)?.filter((u) => u.id !== user.id) ?? []
    );
  }

  public addUser(spaceId: string, user: User) {
    if (!this.rooms.has(spaceId)) {
      this.rooms.set(spaceId, [user]);// create new room with user
      return;
    }
    // add user to existing room
    this.rooms.set(spaceId, [...(this.rooms.get(spaceId) ?? []), user]);
  }

  // Purpose: Send message to EVERYONE including sender
// Use Case: Chat messages (sender sees their own message too)
  public broadcastToAll(message: OutgoingMessage, roomId: string) {
    if (!this.rooms.has(roomId)) return;
    this.rooms.get(roomId)?.forEach((u) => {
      u.send(message);
    });
  }
//  exclude sender when broadcasting->Send message to everyone EXCEPT the sender
  public broadcast(message: OutgoingMessage, user: User, roomId: string) {
    if (!this.rooms.has(roomId)) {
      return;
    }
    this.rooms.get(roomId)?.forEach((u) => {
      if (u.id !== user.id) {
        u.send(message);
      }
    });
  }
  
 
//   Purpose: Find a user across ALL rooms by their database userId
// Use Case: WebRTC video calls (need to send signal to specific user)
  public findUserByUserId(userId: string): User | undefined {
    for (const [, users] of this.rooms) {
      const match = users.find((u) => u.userId === userId);
      if (match) return match;
    }
    return undefined;
  }
}
// broadcastToAll(...) = send to everyone
// broadcast(...) = send to everyone except sender
// findUserByUserId(...) = used for direct peer-to-peer (e.g., WebRTC)