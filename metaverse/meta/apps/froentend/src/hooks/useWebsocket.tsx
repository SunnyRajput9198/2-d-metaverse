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
    const { token, WS_URL, userId, username, avatarId } = useAuth();
    const ws = useRef<WebSocket | null>(null);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [usersInSpace, setUsersInSpace] = useState<{ [key: string]: UserMetadata }>({});
    const [spaceElements, setSpaceElements] = useState<SpaceElementInstance[]>([]);
    const [mapDimensions, setMapDimensions] = useState<{ width: number; height: number } | null>(null);

    const [spawnPoint, setSpawnPoint] = useState<{ x: number; y: number } | null>(null);
    const [map, setMap] = useState<string[][]>();




    const sendJsonMessage = useCallback((message: WebSocketMessage) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(message));
        } else {
            console.warn("WebSocket not open. Message not sent:", message);
        }
    }, []);

    useEffect(() => {
        if (!token || !spaceId || !WS_URL) {
            console.warn("Missing token, spaceId, or WS_URL for WebSocket connection.");
            return;
        }

        // Close any existing connection before opening a new one
        if (ws.current) {
            ws.current.close();
            ws.current = null;
        }

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
                    // Create a users map from the existing users in the payload (may be empty)
                    const initialUsersMap = spaceJoinedPayload.users.reduce((acc, user) => {
                        acc[user.userId] = user;
                        return acc;
                    }, {} as { [key: string]: UserMetadata });



                    // Add current user to the map if not already there, using spawn point
                    if (userId && spaceJoinedPayload.spawn && !initialUsersMap[userId]) {
                        initialUsersMap[userId] = {
                            id: 'self', // placeholder ID
                            userId,
                            x: spaceJoinedPayload.spawn.x,
                            y: spaceJoinedPayload.spawn.y,
                            username: username || 'You',
                            avatarId: avatarId || undefined
                        };
                    }
                    console.log('space-joined elements:', spaceJoinedPayload.elements);
                    console.log('space-joined dimensions:', spaceJoinedPayload.dimensions);

                    console.log('space-joined payload:', message.payload);

                    setUsersInSpace(initialUsersMap);
                    setSpaceElements(spaceJoinedPayload.elements);

                    const [widthStr, heightStr] = spaceJoinedPayload.dimensions.split("x");
                    const parsedDimensions = {
                        width: parseInt(widthStr, 10),
                        height: parseInt(heightStr, 10)
                    };
                    setMapDimensions(parsedDimensions);
                    setSpawnPoint(spaceJoinedPayload.spawn);
                    setMap(spaceJoinedPayload.map); // ✅ Add this line
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
                    // Server dictates position, revert optimistic update for current user
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
            setUsersInSpace({}); // Clear users on disconnect
        };

        ws.current.onerror = (error) => {
            console.error('WebSocket error:', error);
            setIsConnected(false);
        };

        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [spaceId, token, WS_URL, sendJsonMessage, userId]); // Re-run if these dependencies change

    // This `move` function sends the movement request to the backen
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

    // Advance animation frame
    frameCounterRef.current = (frameCounterRef.current + 1) % 3;

    const frame = frameCounterRef.current;

    // Send move message
    sendJsonMessage({
        type: "move",
        payload: {
            x: newX,
            y: newY,
            direction,
            frame
        }
    });

    // Optimistic update
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
        spawnPoint, // May not be needed after initial join
        sendJsonMessage,
        move,
        currentPlayerPosition, // Expose current player's dynamic position
        map
    };
}

export default useWebSocket;