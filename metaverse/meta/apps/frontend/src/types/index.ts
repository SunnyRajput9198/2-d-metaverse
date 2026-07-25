import type { ExcalidrawElement } from './Excelidraw';

export interface AuthResponse {
    token: string;
    userId: string;
    username: string;
    avatarId?: string;
}

export interface ChatMessage {
    userId: string;
    username: string;
    message: string;
    timestamp: number;
}

export interface TypingPayload {
    userId: string;
}

export type ChatMessageBroadcast = ChatMessage;

export interface UserMetadata {
    id: string;        // Internal WebSocket connection ID
    userId: string;    // The actual user's unique userID
    x: number;
    y: number;
    avatarId?: string;
    frame?: number;
    username: string;
    direction?: 'up' | 'down' | 'left' | 'right';
}

export interface SpaceElementInstance {
    id: string;        // ID of this specific instance of the element in the space
    elementId: string; // ID of the base element from /admin/element
    x: number;
    y: number;
    element: {
        imageUrl: string;
        width: number;
        height: number;
    };
}

export interface Space {
    id: string;
    name: string;
    dimensions: string;
    imageUrl: string;
    mapId?: string;
    ownerId: string;
}

// WebSocket Payloads — Outgoing (Frontend → Backend)
export interface JoinPayload {
    spaceId: string;
    token: string;
}

export interface SpaceJoinedPayload {
    users: UserMetadata[];
    elements: SpaceElementInstance[];
    excalidrawElements: ExcalidrawElement[];
    dimensions: string;
    spawn: { x: number; y: number };
    map: string[][];
}

export interface UserJoinedPayload extends UserMetadata {}

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

export type WebSocketMessage =
    | { type: 'join'; payload: JoinPayload }
    | { type: 'space-joined'; payload: SpaceJoinedPayload }
    | { type: 'user-joined'; payload: UserJoinedPayload }
    | { type: 'movement'; payload: MovementPayload }
    | { type: 'movement-rejected'; payload: MovementRejectedPayload }
    | { type: 'user-left'; payload: UserLeftPayload }
    | { type: 'chat-message'; payload: ChatMessageBroadcast }
    | { type: 'emoji-reaction'; payload: { userId: string; emoji: string; timestamp: number } }
    | { type: 'typing'; payload: TypingPayload }
    | { type: 'chat-history'; payload: ChatMessage[] }
    | { type: 'shape-update'; payload: { elements: ExcalidrawElement[] } }
    | { type: 'shape-delete'; payload: { id: string } };
