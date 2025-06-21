import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams } from "react-router-dom";
import useWebSocket from "@/hooks/useWebsocket";
import { Button } from "@/components/ui/button";
import { useVideoCall } from "@/hooks/useVideocall";
import { Maximize2 } from "lucide-react";

import { Fullscreen, VideoOff } from "lucide-react";
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

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
    currentPlayerPosition,
    chatMessages,
    sendChatMessage,
    userId: currentUserId,
    ws,
  } = useWebSocket(spaceId ?? "");

  const {
    startVideo,
    stopVideo,
    localStream,
    peerStreams,
  } = useVideoCall(ws, currentUserId!);

  const [inputValue, setInputValue] = useState("");
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const renderedVideos = useMemo(() => {
    const requestFullscreen = (videoElement: HTMLVideoElement | null) => {
      if (!videoElement) return;
      if (videoElement.requestFullscreen) videoElement.requestFullscreen();
      else if ((videoElement as any).webkitRequestFullscreen) (videoElement as any).webkitRequestFullscreen();
      else if ((videoElement as any).mozRequestFullScreen) (videoElement as any).mozRequestFullScreen();
      else if ((videoElement as any).msRequestFullscreen) (videoElement as any).msRequestFullscreen();
    };

    return (
      <div className="flex gap-4 flex-wrap items-center">
        {/* Local User Video */}
        {localStream && (
          <div className="relative flex flex-col items-center">
            <video
              key="local"
              className="w-40 h-32 border-2 border-white rounded-md"
              ref={(video) => {
                if (video && video.srcObject !== localStream) {
                  video.srcObject = localStream;
                  video.autoplay = true;
                  video.muted = true;
                }
              }}
            />
            <button
              onClick={() => requestFullscreen(document.querySelector("video"))}
              className="absolute top-1 right-1 bg-black bg-opacity-60 hover:bg-opacity-90 p-1 rounded-full"
            >
              <Maximize2 className="h-4 w-4 text-white" />
            </button>
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
                  }
                }}
              />
              <button
                onClick={() => requestFullscreen(document.getElementById(videoId) as HTMLVideoElement)}
                className="absolute top-1 right-1 bg-black bg-opacity-60 hover:bg-opacity-90 p-1 rounded-full"
              >
                <Maximize2 className="h-4 w-4 text-white" />
              </button>
              <span className="text-xs mt-1 text-white opacity-80 truncate max-w-[10rem] text-center">
                {peerUsername}
              </span>
            </div>
          );
        })}
      </div>
    );
  }, [localStream, peerStreams, usersInSpace]);


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentPlayerPosition) return;
      const { x, y } = currentPlayerPosition;

      switch (e.key.toLowerCase()) {
        case "w": move(x, y - 1); break;
        case "a": move(x - 1, y); break;
        case "s": move(x, y + 1); break;
        case "d": move(x + 1, y); break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPlayerPosition, move]);

  if (!isConnected || !map || !currentPlayerPosition) {
    return <div className="text-white text-center mt-10">Connecting to space...</div>;
  }

  const toggleFullscreen = () => {
    const docElm = document.documentElement;
    if (!document.fullscreenElement) {
      docElm.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  return (
    <div className="relative h-screen w-screen bg-black text-white overflow-hidden">
      <div className="flex items-center justify-center h-full">
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
            const frame = user.frame ?? 0;
            const direction = user.direction ?? "down";
            const rowMap = { down: 0, left: 1, right: 2, up: 3 } as const;
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
      </div>

      <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 flex gap-2 z-40">
        <button onClick={() => move(currentPlayerPosition.x, currentPlayerPosition.y - 1)} className="bg-blue-600 px-4 py-2 rounded">↑</button>
        <button onClick={() => move(currentPlayerPosition.x - 1, currentPlayerPosition.y)} className="bg-blue-600 px-4 py-2 rounded">←</button>
        <button onClick={() => move(currentPlayerPosition.x + 1, currentPlayerPosition.y)} className="bg-blue-600 px-4 py-2 rounded">→</button>
        <button onClick={() => move(currentPlayerPosition.x, currentPlayerPosition.y + 1)} className="bg-blue-600 px-4 py-2 rounded">↓</button>
      </div>

      <div className="absolute top-4 left-4 flex gap-2 z-40">
        {!isVideoOpen && (
          <Button onClick={() => { startVideo(); setIsVideoOpen(true); }} className="bg-green-600">🎥 Start Video</Button>
        )}
        {isVideoOpen && (
          <Button onClick={() => { stopVideo(); setIsVideoOpen(false); }} className="bg-red-600 flex items-center gap-2">
            <VideoOff className="w-4 h-4" /> Stop Video
          </Button>
        )}
        <Button onClick={toggleFullscreen} className="bg-gray-700 flex items-center gap-2">
          <Fullscreen className="w-4 h-4" /> Fullscreen
        </Button>
      </div>

      {isVideoOpen && (
        <div className="absolute bottom-4 left-4 flex gap-2 flex-wrap z-40">
          {renderedVideos}
        </div>
      )}

      <Button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="absolute top-4 right-4 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full z-50"
      >💬</Button>

      {isChatOpen && (
        <div className="absolute right-0 top-0 h-full w-[300px] bg-gray-900 border-l border-gray-700 p-4 flex flex-col z-40">
          <div ref={chatBoxRef} className="flex-1 overflow-y-auto bg-gray-800 rounded-lg p-3 mb-3">
            {chatMessages.map((msg, index) => (
              <div
                key={index}
                className={`mb-2 flex ${msg.userId === currentUserId ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] px-3 py-2 rounded-lg text-sm ${msg.userId === currentUserId ? "bg-blue-600 text-white" : "bg-gray-700 text-white"}`}
                >
                  <div className="font-semibold text-xs opacity-80 mb-1">
                    {usersInSpace[msg.userId]?.username || "Anonymous"}
                  </div>
                  <div>{msg.message}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              className="flex-1 px-3 py-2 rounded bg-gray-800 text-white outline-none"
              placeholder="Say something..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && inputValue.trim()) {
                  sendChatMessage(inputValue);
                  setInputValue("");
                }
              }}
            />
            {/* Emoji Picker Button */}
            <button
              onClick={() => setShowEmojiPicker((prev) => !prev)}
              className="text-xl bg-gray-700 rounded px-2 hover:bg-gray-600"
              title="Pick Emoji"
            >
              😊
            </button>

            {/* Emoji Picker Component */}
            {showEmojiPicker && (
              <div className="absolute bottom-14 right-12 z-50">
                <Picker
                  data={data}
                  onEmojiSelect={(emoji: any) => {
                    setInputValue((prev) => prev + emoji.native);
                    setShowEmojiPicker(false);
                  }}
                  theme="dark"
                />
              </div>
            )}

            <Button
              onClick={() => {
                if (inputValue.trim()) {
                  sendChatMessage(inputValue);
                  setInputValue("");
                }
              }}
              className="bg-blue-600 px-4 py-2"
            >Send</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpacePage;
