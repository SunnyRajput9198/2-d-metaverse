import React from "react";

const TILE_SIZE = 32;
const SPRITE_WIDTH = 256;
const SPRITE_HEIGHT = 320;

type Direction = "down" | "left" | "right" | "up";

type User = {
  id: string;
  userId: string;
  x: number;
  y: number;
  frame?: number;
  direction?: Direction;
};

type SpaceElement = {
  x: number;
  y: number;
  element: { imageUrl?: string };
};

type EmojiReaction = {
  emoji: string;
  timestamp: number;
};

type Props = {
  map: string[][];
  spaceElements: SpaceElement[];
  usersInSpace: Record<string, User>;
   currentPlayerPosition: { x: number; y: number }; // ✅ Add this line
  emojiReactions: Record<string, EmojiReaction>;
    TILE_SIZE: number;
  SPRITE_WIDTH: number;
  SPRITE_HEIGHT: number;
};

const MapCanvas: React.FC<Props> = ({ map, spaceElements, usersInSpace, emojiReactions }) => {
  const rowMap = { down: 0, left: 1, right: 2, up: 3 } as const;

  return (
    <div
      className="relative"
      style={{
        width: `${map[0].length * TILE_SIZE}px`,
        height: `${map.length * TILE_SIZE}px`,
        backgroundImage: "url('/maps/m4.png')",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        imageRendering: "pixelated",
      }}
    >
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
            zIndex: ele.y * 100,
          }}
        />
      ))}

      {Object.values(usersInSpace).map((user) => {
        const reaction = emojiReactions[user.userId];
        const emoji = reaction?.emoji;

        const frame = user.frame ?? 0;
        const direction = (user.direction ?? "down") as Direction;
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
            {emoji && (
              <div
                key={reaction.timestamp}
                style={{
                  position: "absolute",
                  top: -20,
                  left: SPRITE_WIDTH / 2,
                  transform: "translateX(-50%)",
                  fontSize: "7rem",
                  animation: "popAndFade 5s ease-out forwards",
                  pointerEvents: "none",
                }}
              >
                {emoji}
              </div>
            )}
            <div
              style={{
                width: SPRITE_WIDTH * 2,
                height: SPRITE_HEIGHT * 4,
                backgroundImage: "url('/maps/a9.png')",
                backgroundRepeat: "no-repeat",
                backgroundSize: `${SPRITE_WIDTH * 4}px ${SPRITE_HEIGHT * 4}px`,
                backgroundPosition: `-${col * SPRITE_WIDTH}px -${row * SPRITE_HEIGHT}px`,
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

export default MapCanvas;