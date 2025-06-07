// src/pages/SpacePage.tsx

import React, { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import useWebSocket from '../hooks/useWebsocket';
import type { UserMetadata } from '../types';

// Assuming each unit is, say, 32x32 pixels
const TILE_SIZE = 32;

const SpacePage: React.FC = () => {
    const { spaceId } = useParams<{ spaceId: string }>();
    const { userId } = useAuth();
    const { isConnected, usersInSpace, spaceElements, mapDimensions, move } = useWebSocket(spaceId || ''); // spaceId can be undefined
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Function to draw everything on the canvas
    const drawMap = () => {
        const canvas = canvasRef.current;
        if (!canvas || !mapDimensions) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return; // Ensure context is not null

        const [mapWidth, mapHeight] = mapDimensions.split('x').map(Number);

        // Set canvas dimensions
        canvas.width = mapWidth * TILE_SIZE;
        canvas.height = mapHeight * TILE_SIZE;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw background (e.g., a simple grid or a base color)
        ctx.fillStyle = '#eee';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Optional: Draw grid lines
        ctx.strokeStyle = '#ccc';
        for (let x = 0; x < mapWidth; x++) {
            ctx.beginPath();
            ctx.moveTo(x * TILE_SIZE, 0);
            ctx.lineTo(x * TILE_SIZE, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < mapHeight; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * TILE_SIZE);
            ctx.lineTo(canvas.width, y * TILE_SIZE);
            ctx.stroke();
        }

        // Draw elements (you'll need to fetch element image URLs from your backend)
        spaceElements.forEach(element => {
            // For now, assume elementId means a generic item
            ctx.fillStyle = 'brown'; // Placeholder color for elements
            ctx.fillRect(element.x * TILE_SIZE, element.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = 'black';
            ctx.strokeRect(element.x * TILE_SIZE, element.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            ctx.font = '10px Arial';
            ctx.fillStyle = 'white';
            ctx.fillText(element.elementId.substring(0, 4), element.x * TILE_SIZE + 2, element.y * TILE_SIZE + 12);
        });

        // Draw users
        Object.values(usersInSpace).forEach((user: UserMetadata) => {
            ctx.fillStyle = user.userId === userId ? 'blue' : 'green'; // Current user is blue, others are green
            ctx.beginPath();
            ctx.arc(user.x * TILE_SIZE + TILE_SIZE / 2, user.y * TILE_SIZE + TILE_SIZE / 2, TILE_SIZE / 2 - 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'black';
            ctx.stroke();

            // Draw username/name above avatar
            ctx.font = '12px Arial';
            ctx.fillStyle = 'black';
            ctx.textAlign = 'center';
            ctx.fillText(user.name || user.userId.substring(0, 8), user.x * TILE_SIZE + TILE_SIZE / 2, user.y * TILE_SIZE - 5);
        });
    };

    useEffect(() => {
        drawMap();
    }, [usersInSpace, spaceElements, mapDimensions]); // Redraw when these change

    // Keyboard controls for movement
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!userId || !usersInSpace[userId] || !mapDimensions) return;

            const currentUser = usersInSpace[userId];
            let newX = currentUser.x;
            let newY = currentUser.y;

            const [mapWidth, mapHeight] = mapDimensions.split('x').map(Number);

            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                    newY--;
                    break;
                case 'ArrowDown':
                case 's':
                    newY++;
                    break;
                case 'ArrowLeft':
                case 'a':
                    newX--;
                    break;
                case 'ArrowRight':
                case 'd':
                    newX++;
                    break;
                default:
                    return; // Ignore other keys
            }
            // Basic client-side boundary check (backend will do full validation)
            if (newX >= 0 && newX < mapWidth && newY >= 0 && newY < mapHeight) {
                move(newX, newY);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [userId, usersInSpace, mapDimensions, move]);


    if (!isConnected) {
        return <div>Connecting to space...</div>;
    }

    if (!mapDimensions) {
        return <div>Loading space data...</div>;
    }

    return (
        <div>
            <h1>Space: {spaceId}</h1>
            <p>You are at: {userId && usersInSpace[userId] ? `(${usersInSpace[userId].x}, ${usersInSpace[userId].y})` : 'Loading...'}</p>
            <p>Connected Users: {Object.keys(usersInSpace).length}</p>
            <canvas ref={canvasRef} style={{ border: '1px solid black' }}></canvas>
            {/* You'd add a chat box, user list, etc. here */}
            <div>
                <h3>Users in Space:</h3>
                <ul>
                    {Object.values(usersInSpace).map((user: UserMetadata) => (
                        <li key={user.userId}>
                            {user.name || `User ${user.userId.substring(0, 8)}`} (X: {user.x}, Y: {user.y}) {user.userId === userId && "(You)"}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default SpacePage;