// src/types/index.ts

export interface AuthResponse {
    token: string;
    userId: string;
}

export interface UserMetadata {
    userId: string;
    x: number;
    y: number;
    avatarId?: string;
    name?: string;
}

export interface SpaceElementInstance {
    id: string; // ID of this specific instance of the element in the space
    elementId: string; // ID of the base element from /admin/element
    x: number;
    y: number;
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

// WebSocket Message Types
export interface WebSocketMessage<T = any> {
    type: string;
    payload: T;
}

export interface JoinPayload {
    spaceId: string;
    token: string;
}

export interface SpaceJoinedPayload {
    users: UserMetadata[];
    elements: SpaceElementInstance[];
    dimensions: string; // e.g., "100x200"
    spawn: { x: number; y: number };
}

export interface UserJoinedPayload extends UserMetadata {} // UserMetadata already has userId, x, y, avatarId, name

export interface MovementPayload {
    userId: string;
    x: number;
    y: number;
}

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