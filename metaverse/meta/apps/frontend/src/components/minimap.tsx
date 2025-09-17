// components/Minimap.tsx
import React from "react";

type User = {
  id: string;
  username: string;
  x: number;
  y: number;
};

type Props = {
  users: User[];
  mapWidth: number;
  mapHeight: number;
};

export const Minimap: React.FC<Props> = ({ users, mapWidth, mapHeight }) => {
  // Return null or a placeholder if map dimensions aren't loaded yet to prevent division by zero.
  if (mapWidth === 0 || mapHeight === 0) {
    return (
      <div className="w-full h-full border border-gray-400 bg-white/80 rounded-md p-1">
        <div className="relative w-full h-full bg-gray-100 overflow-hidden rounded"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full border border-gray-400 bg-white/80 rounded-md p-1">
      <div className="relative w-full h-full bg-gray-100 overflow-hidden rounded">
        {users.map((user) => {
          // --- FIXED: Calculate position based on the center of the tile (x + 0.5) ---
          // This ensures the dot on the minimap aligns with the center of the character on the main map.
          const leftPercent = ((user.x + 0.5) / mapWidth) * 100;
          const topPercent = ((user.y + 0.5) / mapHeight) * 100;
          
          return (
            <div
              key={user.id}
              className="absolute"
              style={{
                left: `${leftPercent}%`,
                top: `${topPercent}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              {/* Username label */}
              <div key={user.id} className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 text-[10px] text-black bg-white/80 px-1 rounded shadow z-10 whitespace-nowrap">
                {user.username}
              </div>
              {/* Dot */}
              <div className="w-2 h-2 rounded-full bg-blue-600 border border-white" />
            </div>
          );
        })}
      </div>
    </div>
  );
};