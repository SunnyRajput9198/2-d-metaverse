import React from "react";

const TILE_SIZE = 42;

type Direction = "down" | "left" | "right" | "up";

type User = {
  id: string;
  userId: string;
  x: number;
  y: number;
  username?: string;
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
  emojiReactions: Record<string, EmojiReaction>;
  currentUserId?: string;
};

const MapCanvas: React.FC<Props> = ({
  map,
  spaceElements,
  usersInSpace,
  emojiReactions,
  currentUserId,
}) => {
  const mapWidth = map[0].length * TILE_SIZE;
  const mapHeight = map.length * TILE_SIZE;

  return (
    <div
      className="relative rounded-lg shadow-2xl overflow-hidden border-2 border-[#24cfa6]/40"
      style={{
        width: `${mapWidth}px`,
        height: `${mapHeight}px`,
        backgroundImage: "url('/homepage/space.png')",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        imageRendering: "pixelated",
      }}
    >
      {/* Furniture & Static Map Elements */}
      {spaceElements.map((ele, index) => (
        ele.element.imageUrl ? (
          <img
            key={index}
            src={ele.element.imageUrl}
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
        ) : null
      ))}

      {/* Animated Character Avatars of All Players */}
      {Object.values(usersInSpace).map((user) => {
        const reaction = emojiReactions[user.userId];
        const emoji = reaction?.emoji;
        const isSelf = user.userId === currentUserId || user.id === "self";
        const isMoving = (user.frame ?? 0) > 0;
        const isFacingLeft = user.direction === "left";

        return (
          <div
            key={user.id || user.userId}
            className="absolute flex flex-col items-center justify-center transition-all duration-150 ease-out"
            style={{
              left: (user.x ?? 0) * TILE_SIZE - TILE_SIZE / 4,
              top: (user.y ?? 0) * TILE_SIZE - TILE_SIZE * 0.7,
              width: TILE_SIZE * 1.5,
              height: TILE_SIZE * 2,
              zIndex: (user.y ?? 0) * 100 + 50,
            }}
          >
            {/* Floating Emoji Reaction */}
            {emoji && (
              <div
                key={reaction.timestamp}
                className="absolute -top-7 text-3xl animate-bounce pointer-events-none z-50"
              >
                {emoji}
              </div>
            )}

            {/* Username Badge */}
            <div
              className={`absolute -top-5 text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-lg border z-40 ${
                isSelf
                  ? "bg-emerald-600 border-emerald-300 ring-2 ring-emerald-400/40"
                  : "bg-purple-700 border-purple-300"
              }`}
            >
              {user.username || (isSelf ? "You" : "Player")}
            </div>

            {/* Player Character Avatar Graphic */}
            <div className="relative w-full h-full flex items-center justify-center pt-2">
              <div
                className={`relative w-12 h-14 transition-transform duration-100 ${
                  isMoving ? "animate-pulse scale-105" : ""
                } ${isFacingLeft ? "scale-x-[-1]" : ""}`}
              >
                <img
                  src="/maps/avat.png"
                  alt="character"
                  className="w-full h-full object-contain filter drop-shadow-md"
                  onError={(e) => {
                    e.currentTarget.src = "/maps/avatar.png";
                  }}
                />
              </div>

              {/* Character Shadow / Base Ring */}
              <div
                className={`absolute bottom-0 w-8 h-2 rounded-full blur-[1px] ${
                  isSelf ? "bg-cyan-400/60 ring-2 ring-cyan-300" : "bg-black/40"
                }`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MapCanvas;