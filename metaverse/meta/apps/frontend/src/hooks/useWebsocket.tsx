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
    const [emojiReactions, setEmojiReactions] = useState<Record<string, { emoji: string, timestamp: number }>>({});
    const [typingUsers, setTypingUsers] = useState<Record<string, number>>({});



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
            username: username!,
            userId,
            message,
            timestamp: Date.now(),
        };

        sendJsonMessage({
            type: 'chat-message',
            payload,
        });
    }, [sendJsonMessage, userId]);

    const sendEmojiReaction = useCallback((emoji: string) => {
        if (!userId) return;
        const timestamp = Date.now();
        sendJsonMessage({
            type: 'emoji-reaction',
            payload: { emoji, userId, timestamp },
        });
        // Optional local update for immediate feedback
        setEmojiReactions((prev) => ({
            ...prev,
            [userId]: { emoji, timestamp }
        }));
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
                    const normalized: ChatMessage = {
                        userId: chatPayload.userId,
                        username: (chatPayload as any).username || usersInSpace[chatPayload.userId]?.username || "Unknown",
                        message: chatPayload.message,
                        timestamp: typeof chatPayload.timestamp === 'string'
                            ? Date.parse(chatPayload.timestamp)
                            : chatPayload.timestamp,
                    };
                    setChatMessages(prev => [...prev, normalized]);
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

                case 'emoji-reaction':
                    const { userId: reactingUserId, emoji } = message.payload;
                    setEmojiReactions((prev) => ({
                        ...prev,
                        [reactingUserId]: { emoji, timestamp: Date.now() }
                    }));


                    // Remove the emoji after 3 seconds
                    setTimeout(() => {
                        setEmojiReactions(prev => {
                            const updated = { ...prev };
                            delete updated[reactingUserId];
                            return updated;
                        });
                    }, 5000);
                    break;
                case 'typing':
                    const typingUserId = message.payload.userId;
                    setTypingUsers(prev => ({
                        ...prev,
                        [typingUserId]: Date.now()
                    }));

                    setTimeout(() => {
                        setTypingUsers(prev => {
                            const updated = { ...prev };
                            if (Date.now() - (updated[typingUserId] || 0) > 3000) {
                                delete updated[typingUserId];
                            }
                            return updated;
                        });
                    }, 3000);
                    break;
                case 'chat-history':
                    const historyPayload = message.payload as ChatMessage[];
                    // Normalize timestamps
                    const normalizedHistory = historyPayload.map(msg => ({
                        ...msg,
                        timestamp:
                            typeof msg.timestamp === 'string'
                                ? Date.parse(msg.timestamp)
                                : msg.timestamp,
                    }));
                    setChatMessages(normalizedHistory);
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

    const onTyping = useCallback(() => {
        if (!userId) return;
        sendJsonMessage({
            type: 'typing',
            payload: { userId }
        });
    }, [userId, sendJsonMessage]);

    const move = useCallback((newX: number, newY: number) => {
        const current = usersInSpace[userId || ""];
        if (!current) return;
        if (
            map && // Only check if map is loaded
            (
                newX < 0 ||
                newY < 0 ||
                newY >= map.length ||       // rows
                newX >= map[0].length       // columns (for non-jagged map)
            )
        ) {
            // Optionally: Show a warning or just return
            // console.log('Tried to move outside map');
            return; // CANCEL movement
        }
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
        sendJsonMessage({
            type: 'movement',
            payload: {
                userId: userId!,
                x: newX,
                y: newY,
                direction,
            }
        });
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
    }, [sendJsonMessage, userId, usersInSpace, map]);




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
        typingUsers,
        onTyping,
        map,
        chatMessages,
        sendChatMessage,
        userId,
        emojiReactions,
        sendEmojiReaction,
        ws: wsRef.current
    };
}

export default useWebSocket;
