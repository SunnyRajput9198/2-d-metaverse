// src/hooks/useWebSocket.ts

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type {
    WebSocketMessage,
    JoinPayload,
    SpaceJoinedPayload,
    UserMetadata,
    SpaceElementInstance,
    UserJoinedPayload,
    MovementPayload,
    UserLeftPayload,
    MovementRejectedPayload
} from '../types';

function useWebSocket(spaceId: string) {
    const { token, WS_URL, userId } = useAuth();
    const ws = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [usersInSpace, setUsersInSpace] = useState<{ [key: string]: UserMetadata }>({});
    const [spaceElements, setSpaceElements] = useState<SpaceElementInstance[]>([]);
    const [mapDimensions, setMapDimensions] = useState<string | null>(null);
    const [spawnPoint, setSpawnPoint] = useState<{ x: number; y: number } | null>(null);

    const sendJsonMessage = useCallback((message: WebSocketMessage) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(message));
        } else {
            console.warn("WebSocket not open. Message not sent:", message);
        }
    }, []);

    useEffect(() => {
        if (!token || !spaceId) return;

        ws.current = new WebSocket(WS_URL);

        ws.current.onopen = () => {
            console.log('WebSocket connected.');
            setIsConnected(true);
            sendJsonMessage({
                type: "join",
                payload: { spaceId, token } as JoinPayload
            });
        };

        ws.current.onmessage = (event) => {
            const message: WebSocketMessage = JSON.parse(event.data);
            console.log('Received WS message:', message);

            switch (message.type) {
                case 'space-joined':
                    const spaceJoinedPayload = message.payload as SpaceJoinedPayload;
                    setUsersInSpace(spaceJoinedPayload.users.reduce((acc, user) => {
                        acc[user.userId] = user;
                        return acc;
                    }, {} as { [key: string]: UserMetadata }));
                    setSpaceElements(spaceJoinedPayload.elements);
                    setMapDimensions(spaceJoinedPayload.dimensions);
                    setSpawnPoint(spaceJoinedPayload.spawn);
                    break;
                case 'user-joined':
                    const userJoinedPayload = message.payload as UserJoinedPayload;
                    setUsersInSpace(prev => ({
                        ...prev,
                        [userJoinedPayload.userId]: userJoinedPayload
                    }));
                    break;
                case 'movement':
                    const movementPayload = message.payload as MovementPayload;
                    setUsersInSpace(prev => ({
                        ...prev,
                        [movementPayload.userId]: {
                            ...prev[movementPayload.userId],
                            x: movementPayload.x,
                            y: movementPayload.y
                        }
                    }));
                    break;
                case 'user-left':
                    const userLeftPayload = message.payload as UserLeftPayload;
                    setUsersInSpace(prev => {
                        const newUsers = { ...prev };
                        delete newUsers[userLeftPayload.userId];
                        return newUsers;
                    });
                    break;
                case 'movement-rejected':
                    const rejectedPayload = message.payload as MovementRejectedPayload;
                    console.warn('Movement rejected:', rejectedPayload.reason);
                    setUsersInSpace(prev => {
                        if (userId && prev[userId]) {
                            return {
                                ...prev,
                                [userId]: {
                                    ...prev[userId],
                                    x: rejectedPayload.x,
                                    y: rejectedPayload.y
                                }
                            };
                        }
                        return prev;
                    });
                    break;
                default:
                    console.log('Unhandled WS message type:', message.type, message);
            }
        };

        ws.current.onclose = () => {
            console.log('WebSocket disconnected.');
            setIsConnected(false);
        };

        ws.current.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [spaceId, token, WS_URL, sendJsonMessage, userId]);

    const move = useCallback((newX: number, newY: number) => {
        sendJsonMessage({
            type: "move",
            payload: { x: newX, y: newY }
        });
        // Optimistic update
        setUsersInSpace(prev => {
            if (userId && prev[userId]) {
                return {
                    ...prev,
                    [userId]: {
                        ...prev[userId],
                        x: newX,
                        y: newY
                    }
                };
            }
            return prev;
        });
    }, [sendJsonMessage, userId]);

    return {
        isConnected,
        usersInSpace,
        spaceElements,
        mapDimensions,
        spawnPoint,
        sendJsonMessage,
        move,
    };
}

export default useWebSocket;