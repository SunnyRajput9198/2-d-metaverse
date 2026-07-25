import React from "react";
import {
  useParticipants,
  useTracks,
  ParticipantTile,
} from "@livekit/components-react";
import { Track } from "livekit-client";

interface VideoCallPanelProps {
  localUserId: string;
}

export function VideoCallPanel({ localUserId }: VideoCallPanelProps) {
  const participants = useParticipants();
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.Microphone, withPlaceholder: false },
  ]);

  console.log("[VideoCallPanel] Participants:", participants.length);
  console.log("[VideoCallPanel] Tracks:", tracks.length);

  // Separate local and remote participants
  const remoteParticipants = participants.filter((p) => p.identity !== localUserId);
  const localParticipant = participants.find((p) => p.identity === localUserId);

  return (
    <div className="fixed bottom-4 right-4 z-[1001] flex flex-col gap-3">
      {/* Remote participants - larger tiles */}
      {remoteParticipants.map((participant) => (
        <div
          key={participant.identity}
          className="relative w-80 h-60 bg-gray-900 rounded-lg overflow-hidden shadow-2xl border-2 border-cyan-500"
        >
          <ParticipantTile
            {...({ participant } as any)}
            className="w-full h-full"
          />
          
          {/* Participant name badge */}
          <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full z-10">
            <span className="text-white text-sm font-medium">
              {participant.name || participant.identity.substring(0, 12)}
            </span>
          </div>
        </div>
      ))}

      {/* Local participant - smaller tile */}
      {localParticipant && (
        <div className="relative w-40 h-30 bg-gray-900 rounded-lg overflow-hidden shadow-xl border-2 border-blue-500">
          <ParticipantTile
            {...({ participant: localParticipant } as any)}
            className="w-full h-full"
          />
          
          {/* "You" badge */}
          <div className="absolute bottom-1 left-1 bg-blue-600/90 backdrop-blur-sm px-2 py-0.5 rounded-full z-10">
            <span className="text-white text-xs font-bold">You</span>
          </div>
        </div>
      )}

      {/* Participant count indicator */}
      {participants.length > 0 && (
        <div className="absolute -top-10 right-0 bg-cyan-600/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-lg">
          <span className="text-white text-sm font-semibold">
            👥 {participants.length} online
          </span>
        </div>
      )}
    </div>
  );
}
