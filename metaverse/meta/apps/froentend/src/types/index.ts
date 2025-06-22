// src/types/index.ts

export interface AuthResponse {
    token: string;
    userId: string;
    username: string;
    avatarId?: string;
}

export interface ChatMessage {
  userId: string;
  message: string;
  timestamp: string; // or number
}

export interface ChatPayload {
  message: string;
}

export interface ChatMessageBroadcast {
  userId: string;
  message: string;
  timestamp: string;
}
export interface UserMetadata {
    id: string; //Internal WebSocket connection ID
    userId: string; //the actual  user's unique userID
    x: number;
    y: number;
    avatarId?: string;
    frame?: number;
    username?: string;
    direction?: 'up' | 'down' | 'left' | 'right';
}

export interface SpaceElementInstance {
    id: string; // ID of this specific instance of the element in the space
    elementId: string; // ID of the base element from /admin/element
    x: number;
    y: number;
    element: {
        imageUrl: string;
        width: number;
        height: number;
    };
}

export interface MapData {
    id: string;
    thumbnail: string;
    dimensions: string; // e.g., "100x200"
    name: string;
    defaultElements: {
        elementId: string;
        x: number;
        y: number;
    }[];
}

export interface Space {
    id: string;
    name: string;
    dimensions: string;
    imageUrl: string;
    mapId?: string;
    ownerId: string;
}

export interface Avatar {
    id: string;
    imageUrl: string;
    name: string;
}

// WebSocket Message Type

// --- Payloads for Outgoing Messages (Frontend -> Backend) --
export interface JoinPayload {
    spaceId: string;
    token: string;
}
export interface MovePayload {
    x: number;
    y: number;
}


export interface SpaceJoinedPayload {
    users: UserMetadata[];
    elements: SpaceElementInstance[];
    dimensions: string; // e.g., "100x200"
    spawn: { x: number; y: number };
    map: string[][]
}

export interface UserJoinedPayload extends UserMetadata {} // UserMetadata already has userId, x, y, avatarId, name
export type MovementPayload = {
    userId: string;
    x: number;
    y: number;
    direction?: 'up' | 'down' | 'left' | 'right';
    frame?: number;
};


export interface UserLeftPayload {
    userId: string;
}

export interface MovementRejectedPayload {
    x: number;
    y: number;
    reason: string;
}

// Example for a general chat message if you implement it
export interface ChatMessagePayload {
    userId: string;
    message: string;
    timestamp: number;
}
export type WebSocketMessage =
  | { type: 'join'; payload: JoinPayload }
  | { type: 'space-joined'; payload: SpaceJoinedPayload }
  | { type: 'user-joined'; payload: UserJoinedPayload }
  | { type: 'movement'; payload: MovementPayload }
  | { type: 'movement-rejected'; payload: MovementRejectedPayload }
  | { type: 'user-left'; payload: UserLeftPayload }
  | { type: 'chat-message'; payload: ChatMessageBroadcast }
  | { type: "emoji-reaction"; payload: { userId: string; emoji: string ; timestamp: number } }

  // Client to Server
export type SendEmojiPayload = {
  emoji: string;
};

// Server to Client
export type UserEmojiPayload = {
  userId: string;
  emoji: string;
  timestamp: number;
};
