import React, { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Maximize2, Mic, MicOff, Video, VideoOff } from "lucide-react";
import type { UserMetadata } from "@/types";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

type VideoPanelProps = {
  localStream: MediaStream | null;
  peerStreams: {
    peerId: string;
    stream: MediaStream;
    muted?: boolean;
    speaking?: boolean;
  }[];
  usersInSpace: Record<string, UserMetadata>;
  isScreenSharing?: boolean;
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
};

const VideoPanel: React.FC<VideoPanelProps> = ({
  localStream,
  peerStreams,
  usersInSpace,
  localVideoRef,
  isScreenSharing
}) => {
  // --- NEW: State for local media controls ---
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const requestFullscreen = useCallback(async (videoElement: HTMLVideoElement | null) => {
    if (!videoElement) return;

    try {
      if (videoElement.paused) await videoElement.play();

      setTimeout(() => {
        videoElement.requestFullscreen?.();
        (videoElement as any).webkitRequestFullscreen?.();
        (videoElement as any).mozRequestFullScreen?.();
        (videoElement as any).msRequestFullscreen?.();
      }, 100);
    } catch (err) {
      console.warn("Fullscreen request failed:", err);
    }
  }, []);
  // --- NEW: Toggle microphone ---
  const toggleMute = useCallback(() => {
    if (!localStream) return;
    localStream.getAudioTracks().forEach(track => {
      track.enabled = !track.enabled;
    });
    setIsMuted(prev => !prev);
  }, [localStream]);

  // --- NEW: Toggle camera ---
  const toggleCamera = useCallback(() => {
    if (!localStream) return;
    localStream.getVideoTracks().forEach(track => {
      track.enabled = !track.enabled;
    });
    setIsCameraOff(prev => !prev);
  }, [localStream]);
  // Sync initial state
  useEffect(() => {
    if (localStream) {
      setIsMuted(!localStream.getAudioTracks().some(t => t.enabled));
      setIsCameraOff(!localStream.getVideoTracks().some(t => t.enabled));
    }
  }, [localStream]);

  return (
    <div className="relative w-full h-full flex flex-col justify-end gap-4 p-4 items-start z-50">
      {/* Local Video */}
      {localStream && (
        <motion.div
          drag
          dragElastic={0.2}
          dragMomentum={false}
          className="relative cursor-grab pointer-events-auto"
        >
          <video
            className="w-52 h-36 border-2 border-white rounded-md"
            ref={(video) => {
              if (video) {
                localVideoRef.current = video;
                if (video.srcObject !== localStream) {
                  video.srcObject = localStream;
                }
                video.muted = true;
                video.autoplay = true;
                video.playsInline = true;
                video.play().catch((err) =>
                  console.warn("Local video playback failed:", err)
                );
              }
            }}
          />
          <Button
            onClick={() => requestFullscreen(localVideoRef.current)}
            className="absolute top-1 right-1 bg-black bg-opacity-60 hover:bg-opacity-90 p-1 rounded-full"
          >
            <Maximize2 className="h-4 w-4 text-white" />
          </Button>

          {/* Show badge ONLY if screen sharing AND it's your local stream */}
          {isScreenSharing && (
            <div className="absolute bottom-1 left-1 px-2 py-1 text-xs rounded bg-blue-600 text-white">
              🖥 Sharing Screen
            </div>
          )}

          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-white opacity-80">You</span>
            {/* --- NEW: Local media control buttons --- */}
            <Button onClick={toggleMute} className="bg-gray-700 hover:bg-gray-600 p-2 rounded-full h-8 w-8">
              {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Button onClick={toggleCamera} className="bg-gray-700 hover:bg-gray-600 p-2 rounded-full h-8 w-8">
              {isCameraOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Peer Videos */}
      {peerStreams.map(({ peerId, stream, muted, speaking }, idx) => {
        const peerUsername = usersInSpace[peerId]?.username || "Guest";
        const videoId = `peer-video-${idx}`;
        const borderStyle = speaking
          ? "border-green-400 border-4 shadow-lg shadow-green-400/50"
          : "border-yellow-400 border-2";
        return (
          <motion.div
            key={peerId}
            drag
            dragElastic={0.2}
            dragMomentum={false}
             animate={{ scale: speaking ? 1.02 : 1 }}
            className="relative cursor-grab pointer-events-auto"
          >
            <video
              id={videoId}
              className={`w-full h-full rounded-md object-cover transition-all duration-300 ${borderStyle}`}
              ref={(video) => {
                if (video && video.srcObject !== stream) {
                  video.srcObject = stream;
                  video.autoplay = true;
                  video.playsInline = true;
                  video.play().catch((err) =>
                    console.warn(`Peer video ${peerId} playback failed:`, err)
                  );
                }
              }}
            />
            <Button
              onClick={() =>
                requestFullscreen(document.getElementById(videoId) as HTMLVideoElement)
              }
              className="absolute top-1 right-1 bg-black bg-opacity-60 hover:bg-opacity-90 p-1 rounded-full"
            >
              <Maximize2 className="h-4 w-4 text-white" />
            </Button>
            <div className="absolute bottom-1 right-1 px-2 py-1 text-xs rounded bg-black/60 text-white">
              {muted ? "Muted" : speaking ? "Speaking" : "Live"}
            </div>
            <span className="text-xs mt-1 text-white opacity-80 truncate max-w-[10rem] text-center">
              {peerUsername}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
};
export default VideoPanel;