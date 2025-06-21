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
    MovementRejectedPayload,
    ChatMessageBroadcast,
    ChatMessage
} from '../types';

function useWebSocket(spaceId: string) {
    const { token, WS_URL, userId, username, avatarId } = useAuth();
    const wsRef = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [usersInSpace, setUsersInSpace] = useState<{ [key: string]: UserMetadata }>({});
    const [spaceElements, setSpaceElements] = useState<SpaceElementInstance[]>([]);
    const [mapDimensions, setMapDimensions] = useState<{ width: number; height: number } | null>(null);
    const [spawnPoint, setSpawnPoint] = useState<{ x: number; y: number } | null>(null);
    const [map, setMap] = useState<string[][]>();
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

    const sendJsonMessage = useCallback((message: WebSocketMessage) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(message));
        } else {
            console.warn("WebSocket not open. Message not sent:", message);
        }
    }, []);

    // ✅ sendChatMessage properly defined outside `move`
    const sendChatMessage = useCallback((message: string) => {
        if (!userId) return;

        const payload: ChatMessageBroadcast = {
            userId,
            message,
            timestamp: new Date().toISOString(),
        };

        sendJsonMessage({
            type: 'chat-message',
            payload,
        });
    }, [sendJsonMessage, userId]);

    useEffect(() => {
        if (!token || !spaceId || !WS_URL) {
            console.warn("Missing token, spaceId, or WS_URL for WebSocket connection.");
            return;
        }

        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        wsRef.current = new WebSocket(WS_URL);

        wsRef.current.onopen = () => {
            console.log('WebSocket connected.');
            setIsConnected(true);
            sendJsonMessage({
                type: "join",
                payload: { spaceId, token } as JoinPayload
            });
        };

        wsRef.current.onmessage = (event) => {
            const message: WebSocketMessage = JSON.parse(event.data);
            console.log('Received WS message:', message);

            switch (message.type) {
                case 'space-joined':
                    const spaceJoinedPayload = message.payload as SpaceJoinedPayload;
                    const initialUsersMap = spaceJoinedPayload.users.reduce((acc, user) => {
                        acc[user.userId] = user;
                        return acc;
                    }, {} as { [key: string]: UserMetadata });

                    if (userId && spaceJoinedPayload.spawn && !initialUsersMap[userId]) {
                        initialUsersMap[userId] = {
                            id: 'self',
                            userId,
                            x: spaceJoinedPayload.spawn.x,
                            y: spaceJoinedPayload.spawn.y,
                            username: username || 'You',
                            avatarId: avatarId || undefined
                        };
                    }

                    setUsersInSpace(initialUsersMap);
                    setSpaceElements(spaceJoinedPayload.elements);
                    const [widthStr, heightStr] = spaceJoinedPayload.dimensions.split("x");
                    setMapDimensions({ width: parseInt(widthStr), height: parseInt(heightStr) });
                    setSpawnPoint(spaceJoinedPayload.spawn);
                    setMap(spaceJoinedPayload.map);
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
                            y: movementPayload.y,
                            direction: movementPayload.direction || 'down',
                            frame: movementPayload.frame ?? 0
                        }
                    }));
                    break;

                case 'chat-message':
                    const chatPayload = message.payload as ChatMessageBroadcast;
                    setChatMessages(prev => [...prev, chatPayload]);
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
                    console.warn('Movement rejected by server:', rejectedPayload.reason);
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

        wsRef.current.onclose = () => {
            console.log('WebSocket disconnected.');
            setIsConnected(false);
            setUsersInSpace({});
        };

        wsRef.current.onerror = (error) => {
            console.error('WebSocket error:', error);
            setIsConnected(false);
        };

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [spaceId, token, WS_URL, sendJsonMessage, userId]);

    const frameCounterRef = useRef<number>(0);

    const move = useCallback((newX: number, newY: number) => {
        const current = usersInSpace[userId || ""];
        if (!current) return;

        const dx = newX - current.x;
        const dy = newY - current.y;
        let direction: 'up' | 'down' | 'left' | 'right' = current.direction || 'down';

        if (Math.abs(dx) > Math.abs(dy)) {
            direction = dx > 0 ? 'right' : 'left';
        } else if (dy !== 0) {
            direction = dy > 0 ? 'down' : 'up';
        }

        frameCounterRef.current = (frameCounterRef.current + 1) % 3;
        const frame = frameCounterRef.current;

        setUsersInSpace(prev => {
            if (userId && prev[userId]) {
                return {
                    ...prev,
                    [userId]: {
                        ...prev[userId],
                        x: newX,
                        y: newY,
                        direction,
                        frame
                    }
                };
            }
            return prev;
        });
    }, [sendJsonMessage, userId, usersInSpace]);

    const currentPlayerPosition = userId && usersInSpace[userId]
        ? usersInSpace[userId]
        : spawnPoint
            ? { id: 'self', userId, x: spawnPoint.x, y: spawnPoint.y }
            : null;

    return {
        isConnected,
        usersInSpace,
        spaceElements,
        mapDimensions,
        spawnPoint,
        sendJsonMessage,
        move,
        currentPlayerPosition,
        map,
        chatMessages,
        sendChatMessage,
        userId,
        ws: wsRef.current
    };
}

export default useWebSocket;
