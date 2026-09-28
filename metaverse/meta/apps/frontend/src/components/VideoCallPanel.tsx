import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { ParticipantTile, RoomAudioRenderer, useConnectionState, useLocalParticipant, useTracks } from "@livekit/components-react";
import { ConnectionState, Track } from "livekit-client";
import { GripVertical, Mic, MicOff, PhoneOff, Video, VideoOff, X } from "lucide-react";

type Props = { minimized: boolean; onMinimize: () => void; onEnd: () => void };
type Point = { x: number; y: number };
type Size = { width: number; height: number };
type Interaction = { type: "drag" | "resize"; startPointer: Point; startPosition: Point; startSize: Size };

const EDGE = 16;
const DEFAULT_SIZE = { width: 460, height: 360 };

const getLimits = (position: Point) => {
  const maxWidth = Math.max(1, Math.min(700, window.innerWidth - position.x - EDGE));
  const maxHeight = Math.max(1, Math.min(600, window.innerHeight - position.y - EDGE));
  return {
    minWidth: Math.min(320, maxWidth),
    minHeight: Math.min(240, maxHeight),
    maxWidth,
    maxHeight,
  };
};

const clampWindow = (position: Point, size: Size) => {
  const maxWidth = Math.max(1, Math.min(700, window.innerWidth - EDGE * 2));
  const maxHeight = Math.max(1, Math.min(600, window.innerHeight - EDGE * 2));
  const width = Math.min(size.width, maxWidth);
  const height = Math.min(size.height, maxHeight);
  return {
    position: {
      x: Math.min(Math.max(EDGE, position.x), Math.max(EDGE, window.innerWidth - width - EDGE)),
      y: Math.min(Math.max(EDGE, position.y), Math.max(EDGE, window.innerHeight - height - EDGE)),
    },
    size: { width, height },
  };
};

export function VideoCallPanel({ minimized, onMinimize, onEnd }: Props) {
  const connectionState = useConnectionState();
  const { localParticipant, isCameraEnabled, isMicrophoneEnabled, lastCameraError, lastMicrophoneError } = useLocalParticipant();
  const cameraTracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }]);
  const [position, setPosition] = useState<Point | null>(null);
  const [size, setSize] = useState<Size>(DEFAULT_SIZE);
  const interactionRef = useRef<Interaction | null>(null);
  const isConnected = connectionState === ConnectionState.Connected;

  const clampCurrentWindow = useCallback(() => {
    setPosition((currentPosition) => {
      if (!currentPosition) return currentPosition;
      let nextPosition = currentPosition;
      setSize((currentSize) => {
        const clamped = clampWindow(currentPosition, currentSize);
        nextPosition = clamped.position;
        return clamped.size;
      });
      return nextPosition;
    });
  }, []);

  useEffect(() => {
    const initial = clampWindow(
      { x: window.innerWidth - DEFAULT_SIZE.width - EDGE, y: window.innerHeight - DEFAULT_SIZE.height - EDGE },
      DEFAULT_SIZE,
    );
    setPosition(initial.position);
    setSize(initial.size);
    window.addEventListener("resize", clampCurrentWindow);
    return () => window.removeEventListener("resize", clampCurrentWindow);
  }, [clampCurrentWindow]);

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      const interaction = interactionRef.current;
      if (!interaction) return;
      const deltaX = event.clientX - interaction.startPointer.x;
      const deltaY = event.clientY - interaction.startPointer.y;

      if (interaction.type === "drag") {
        const clamped = clampWindow({ x: interaction.startPosition.x + deltaX, y: interaction.startPosition.y + deltaY }, interaction.startSize);
        setPosition(clamped.position);
        return;
      }

      const limits = getLimits(interaction.startPosition);
      setSize({
        width: Math.min(limits.maxWidth, Math.max(limits.minWidth, interaction.startSize.width + deltaX)),
        height: Math.min(limits.maxHeight, Math.max(limits.minHeight, interaction.startSize.height + deltaY)),
      });
    };
    const stopInteraction = () => { interactionRef.current = null; };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stopInteraction);
    window.addEventListener("pointercancel", stopInteraction);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", stopInteraction);
      window.removeEventListener("pointercancel", stopInteraction);
    };
  }, []);

  const beginInteraction = (type: Interaction["type"], event: ReactPointerEvent<HTMLElement>) => {
    if (!position || event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    interactionRef.current = { type, startPointer: { x: event.clientX, y: event.clientY }, startPosition: position, startSize: size };
  };

  if (!position) return null;

  const windowStyle = { left: position.x, top: position.y, width: size.width, height: size.height };
  if (minimized) {
    return <button onClick={onMinimize} style={{ left: position.x, top: position.y }} className="fixed z-[1001] flex items-center gap-2 rounded-full border border-emerald-300/30 bg-slate-950/90 px-4 py-2 text-sm font-semibold text-white shadow-xl backdrop-blur hover:bg-slate-800"><span className={`h-2 w-2 rounded-full ${isConnected ? "bg-emerald-400" : "bg-amber-400"}`} />Video call</button>;
  }

  return (
    <section style={windowStyle} className="fixed z-[1001] flex min-h-0 flex-col overflow-hidden rounded-2xl border border-emerald-300/25 bg-slate-950/95 text-white shadow-2xl shadow-black/50 backdrop-blur">
      <RoomAudioRenderer />
      <header onPointerDown={(event) => beginInteraction("drag", event)} className="flex cursor-grab touch-none select-none items-center justify-between border-b border-white/10 px-3 py-2.5 active:cursor-grabbing">
        <div className="flex items-center gap-1.5"><GripVertical className="h-4 w-4 text-slate-500" aria-hidden="true" /><div><p className="text-sm font-semibold">Video call</p><p className={`text-xs ${isConnected ? "text-emerald-300" : "text-amber-300"}`}>{isConnected ? "Connected" : "Connecting to room…"}</p></div></div>
        <div className="flex items-center gap-1"><button onPointerDown={(event) => event.stopPropagation()} onClick={onMinimize} aria-label="Minimize video call" className="rounded-md p-2 text-slate-300 hover:bg-white/10" title="Minimize video call"><X className="h-4 w-4" /></button><button onPointerDown={(event) => event.stopPropagation()} onClick={onEnd} aria-label="End video call" className="rounded-md bg-red-500/90 p-2 hover:bg-red-500" title="End video call"><PhoneOff className="h-4 w-4" /></button></div>
      </header>
      <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-1 gap-2 overflow-y-auto p-2 sm:grid-cols-2">
        {cameraTracks.map((trackRef) => {
          const participant = trackRef.participant;
          const microphonePublication = participant.getTrackPublication(Track.Source.Microphone);
          return <div key={`${participant.identity}-${trackRef.source}`} className="relative min-h-28 overflow-hidden rounded-xl bg-slate-900 ring-1 ring-white/10"><ParticipantTile trackRef={trackRef} className="h-full w-full" /><div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-black/65 px-2 py-1 text-xs font-medium backdrop-blur"><span>{participant.isLocal ? "You" : participant.name || participant.identity}</span>{microphonePublication?.isMuted ? <MicOff className="h-3.5 w-3.5 text-rose-300" /> : <Mic className="h-3.5 w-3.5 text-emerald-300" />}</div></div>;
        })}
      </div>
      {(lastCameraError || lastMicrophoneError) && <p className="px-3 pb-2 text-xs text-amber-200">{lastCameraError?.message || lastMicrophoneError?.message}</p>}
      <footer className="flex shrink-0 justify-center gap-3 border-t border-white/10 p-3"><button onClick={() => void localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)} aria-label={isMicrophoneEnabled ? "Mute microphone" : "Enable microphone"} className={`rounded-full p-3 ${isMicrophoneEnabled ? "bg-slate-700 hover:bg-slate-600" : "bg-rose-600 hover:bg-rose-500"}`} title={isMicrophoneEnabled ? "Mute microphone" : "Enable microphone"}>{isMicrophoneEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}</button><button onClick={() => void localParticipant.setCameraEnabled(!isCameraEnabled)} aria-label={isCameraEnabled ? "Turn camera off" : "Enable camera"} className={`rounded-full p-3 ${isCameraEnabled ? "bg-slate-700 hover:bg-slate-600" : "bg-rose-600 hover:bg-rose-500"}`} title={isCameraEnabled ? "Turn camera off" : "Enable camera"}>{isCameraEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}</button></footer>
      <div onPointerDown={(event) => beginInteraction("resize", event)} role="presentation" className="absolute bottom-0 right-0 h-6 w-6 cursor-nwse-resize touch-none after:absolute after:bottom-1.5 after:right-1.5 after:h-2 after:w-2 after:border-b-2 after:border-r-2 after:border-emerald-200/60" />
    </section>
  );
}
