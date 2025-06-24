import React, { useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Maximize2 } from "lucide-react";
import type { UserMetadata } from "@/types";

type VideoPanelProps = {
  localStream: MediaStream | null;
  peerStreams: { peerId: string; stream: MediaStream }[];
  usersInSpace: Record<string, UserMetadata>;
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
};

const VideoPanel: React.FC<VideoPanelProps> = ({
  localStream,
  peerStreams,
  usersInSpace,
  localVideoRef,
}) => {
  const requestFullscreen = useCallback(async (videoElement: HTMLVideoElement | null) => {
    if (!videoElement) return;

    try {
      if (videoElement.paused) {
        await videoElement.play();
      }

      // Let DOM settle
      setTimeout(() => {
        if (videoElement.requestFullscreen) videoElement.requestFullscreen();
        else if ((videoElement as any).webkitRequestFullscreen) (videoElement as any).webkitRequestFullscreen();
        else if ((videoElement as any).mozRequestFullScreen) (videoElement as any).mozRequestFullScreen();
        else if ((videoElement as any).msRequestFullscreen) (videoElement as any).msRequestFullscreen();
      }, 100); // Short delay improves fullscreen smoothness
    } catch (err) {
      console.warn("Fullscreen request failed:", err);
    }
  }, []);

  const renderedVideos = useMemo(() => (
    <div className="flex gap-4 flex-wrap items-center">
      {/* Local User Video */}
      {localStream && (
        <div className="relative flex flex-col items-center">
          <video
            key="local"
            className="w-40 h-32 border-2 border-white rounded-md"
            ref={(video) => {
              if (video) {
                localVideoRef.current = video;
                if (video.srcObject !== localStream) {
                  video.srcObject = localStream;
                }
                video.muted = true;
                video.autoplay = true;
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
          <span className="text-xs mt-1 text-white opacity-80">You</span>
        </div>
      )}

      {/* Peer Videos */}
      {peerStreams.map(({ peerId, stream }, idx) => {
        const peerUsername = usersInSpace[peerId]?.username || "Guest";
        const videoId = `peer-video-${idx}`;

        return (
          <div key={peerId} className="relative flex flex-col items-center">
            <video
              id={videoId}
              className="w-40 h-32 border-2 border-yellow-400 rounded-md"
              ref={(video) => {
                if (video && video.srcObject !== stream) {
                  video.srcObject = stream;
                  video.autoplay = true;
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
            <span className="text-xs mt-1 text-white opacity-80 truncate max-w-[10rem] text-center">
              {peerUsername}
            </span>
          </div>
        );
      })}
    </div>
  ), [localStream, peerStreams, usersInSpace, requestFullscreen]);

  return renderedVideos;
};

export default VideoPanel;
