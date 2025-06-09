import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import useWebSocket from "../hooks/useWebsocket";

const TILE_SIZE = 24;

const SpacePage: React.FC = () => {
    const { spaceId } = useParams<{ spaceId: string }>();

    const {
        isConnected,
        usersInSpace,
        map,
        move,
        currentPlayerPosition
    } = useWebSocket(spaceId ?? "");

    // Movement Controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!currentPlayerPosition) return;
            const { x, y } = currentPlayerPosition;

            switch (e.key.toLowerCase()) {
                case "w":
                    move(x, y - 1);
                    break;
                case "a":
                    move(x - 1, y);
                    break;
                case "s":
                    move(x, y + 1);
                    break;
                case "d":
                    move(x + 1, y);
                    break;
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [currentPlayerPosition, move]);

    if (!isConnected || !map || !currentPlayerPosition) {
        return <div className="text-white text-center mt-10">Connecting to space...</div>;
    }

    return (
        <div className="p-4 overflow-auto h-screen bg-black text-white">
            <div className="text-xl font-bold mb-4">Space ID: {spaceId}</div>

            {/* 🗺️ Background map with overlaid players */}
            <div
                className="inline-block"
                style={{
                    width: "1920px",
                    height: "1440px",
                    backgroundImage: "url('/maps/mata4.png')", // make sure image is in public/maps
                    backgroundSize: "cover",
                    backgroundRepeat: "no-repeat",
                    imageRendering: "pixelated",
                    position: "relative",
                }}
            >
                {/* 🧍 Render each user */}
                {Object.values(usersInSpace).map((user) => (
                    <img
                        key={user.id}
                        src="/maps/avatar.png" // your custom image
                        alt="player"
                        style={{
                            position: "absolute",
                            width: TILE_SIZE * 1.5, // 48px
                            height: TILE_SIZE * 1.5, // 48px
                            left: user.x * TILE_SIZE - TILE_SIZE / 1.5, // shift left by 12px
                            top: user.y * TILE_SIZE - TILE_SIZE / 1.5, // shift up by 12px
                            transition: "left 0.15s, top 0.15s",
                            zIndex: 10,
                            imageRendering: "pixelated",
                        }}
                    />
                ))}
            </div>

            {/* Movement Buttons */}
            <div className="mt-6 flex gap-2">
                <button onClick={() => move(currentPlayerPosition.x, currentPlayerPosition.y - 1)} className="bg-blue-600 px-3 py-2 rounded">Up</button>
                <button onClick={() => move(currentPlayerPosition.x - 1, currentPlayerPosition.y)} className="bg-blue-600 px-3 py-2 rounded">Left</button>
                <button onClick={() => move(currentPlayerPosition.x + 1, currentPlayerPosition.y)} className="bg-blue-600 px-3 py-2 rounded">Right</button>
                <button onClick={() => move(currentPlayerPosition.x, currentPlayerPosition.y + 1)} className="bg-blue-600 px-3 py-2 rounded">Down</button>
            </div>
        </div>
    );
};

export default SpacePage;
