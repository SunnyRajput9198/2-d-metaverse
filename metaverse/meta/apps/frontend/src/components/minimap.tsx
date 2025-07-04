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
  return (
    <div className="w-full h-full border border-gray-400 bg-white/80 rounded-md p-1">
      <div className="relative w-full h-full bg-gray-100 overflow-visible rounded">
        {users.map((user) => {
          const leftPercent = (user.x / mapWidth) * 100;
          const topPercent = (user.y / mapHeight) * 100;
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
     <div className="mb-1 text-[10px] text-black bg-white px-1 rounded shadow z-[999]">
  {user.username}
</div>
      {/* Dot */}
              <div className="w-2 h-2 rounded-full bg-blue-600" />
            </div>
          );
        })}
      </div>
    </div>
  );
};
