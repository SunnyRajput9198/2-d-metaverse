import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import useWebSocket from "../hooks/useWebsocket";

const TILE_SIZE = 32;
           const SPRITE_WIDTH = 256;
const SPRITE_HEIGHT = 320;
const SpacePage: React.FC = () => {
    const { spaceId } = useParams<{ spaceId: string }>();

    const {
        isConnected,
        usersInSpace,
        map,
        spaceElements,
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
            <div
                className="inline-block relative"
                style={{
                    width: `${map[0].length * TILE_SIZE}px`,
                    height: `${map.length * TILE_SIZE}px`,
                    backgroundImage: "url('/maps/m4.png')",
                    backgroundSize: "cover",
                    backgroundRepeat: "no-repeat",
                    imageRendering: "pixelated",
                }}
            >
                {/* 🧱 Map Elements (above background, below players) */}
                {spaceElements.map((ele, index) => (
                    <img
                        key={index}
                        src={ele.element.imageUrl || "/maps/object.png"}
                        alt="element"
                        style={{
                            position: "absolute",
                            width: TILE_SIZE * 2,
                            height: TILE_SIZE * 2,
                            left: ele.x * TILE_SIZE,
                            top: ele.y * TILE_SIZE,
                            imageRendering: "pixelated",
                            transition: "left 0.2s, top 0.2s",
                            zIndex: ele.y * 100, // Depth sorting by Y
                        }}
                    />
                ))}

                {/* 🧍 Render Players (top-most layer) */}


{Object.values(usersInSpace).map((user) => {
    const frame = user.frame ?? 0;
    const direction = user.direction ?? "down";
   const rowMap = {
    down: 0,
    left: 1,
    right: 2,
    up: 3,
} as const;

    const row = rowMap[direction];
    const col = frame % 2;

    return (
        <div
            key={user.id}
            style={{
                position: "absolute",
                left: user.x * TILE_SIZE,
                top: user.y * TILE_SIZE,
                width: SPRITE_WIDTH,
                height: SPRITE_HEIGHT,
                overflow: "hidden",
                zIndex: user.y * 100 + 50,
                imageRendering: "pixelated",
                transition: "left 0.15s, top 0.15s",
                transform: "scale(0.125)",
                transformOrigin: "top left",
            }}
        >
            <div
                style={{
                    width: SPRITE_WIDTH * 2,
                    height: SPRITE_HEIGHT * 4,
                    backgroundImage: "url('/maps/a6.png')",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: `${SPRITE_WIDTH * 2}px ${SPRITE_HEIGHT * 4}px`,
                    backgroundPosition: `-${col * SPRITE_WIDTH}px -${row * SPRITE_HEIGHT}px`,
                }}
            />
        </div>
    );
})}

            </div>

            {/* 🕹️ Movement Buttons (for mobile) */}
            <div className="mt-6 flex justify-center gap-2">
                <button onClick={() => move(currentPlayerPosition.x, currentPlayerPosition.y - 1)} className="bg-blue-600 px-3 py-2 rounded">Up</button>
                <button onClick={() => move(currentPlayerPosition.x - 1, currentPlayerPosition.y)} className="bg-blue-600 px-3 py-2 rounded">Left</button>
                <button onClick={() => move(currentPlayerPosition.x + 1, currentPlayerPosition.y)} className="bg-blue-600 px-3 py-2 rounded">Right</button>
                <button onClick={() => move(currentPlayerPosition.x, currentPlayerPosition.y + 1)} className="bg-blue-600 px-3 py-2 rounded">Down</button>
            </div>
        </div>
    );
};

export default SpacePage;
