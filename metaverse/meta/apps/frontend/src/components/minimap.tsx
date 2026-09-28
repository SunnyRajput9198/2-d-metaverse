import type { UserMetadata } from "@/types";

type Props = {
  users: Record<string, UserMetadata>;
  currentUserId?: string | null;
  mapWidth: number;
  mapHeight: number;
};

export function Minimap({ users, currentUserId, mapWidth, mapHeight }: Props) {
  const participants = Object.values(users);
  if (!mapWidth || !mapHeight) return null;

  return (
    <div className="w-36 rounded-xl border border-white/15 bg-slate-950/80 p-2 shadow-xl shadow-black/30 backdrop-blur-md sm:w-40">
      <div className="mb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-slate-300">
        <span>Space map</span>
        <span className="rounded-full bg-emerald-400/15 px-1.5 py-0.5 text-emerald-300">{participants.length} online</span>
      </div>
      <div className="relative aspect-square overflow-hidden rounded-lg border border-cyan-300/10 bg-gradient-to-br from-slate-800/90 to-slate-950">
        <div className="absolute inset-2 rounded border border-dashed border-cyan-200/10" />
        {participants.map((user) => {
          const isSelf = user.userId === currentUserId || user.id === "self";
          const left = Math.min(100, Math.max(0, ((user.x + 0.5) / mapWidth) * 100));
          const top = Math.min(100, Math.max(0, ((user.y + 0.5) / mapHeight) * 100));
          return (
            <span
              key={user.userId}
              title={isSelf ? `${user.username || "You"} (you)` : user.username}
              className={`absolute block rounded-full transition-[left,top] duration-150 ${isSelf
                ? "h-3 w-3 border-2 border-white bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.9)]"
                : "h-2 w-2 border border-slate-100/70 bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,.7)]"}`}
              style={{ left: `${left}%`, top: `${top}%`, transform: "translate(-50%, -50%)" }}
            />
          );
        })}
      </div>
    </div>
  );
}
