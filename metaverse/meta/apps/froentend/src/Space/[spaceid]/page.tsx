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
    emojiReactions,
    sendEmojiReaction
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

  // Separate emoji picker state for chat and avatar reaction
  const [showChatEmojiPicker, setShowChatEmojiPicker] = useState(false);
  // New state for avatar emoji picker position only
  const [avatarEmojiPickerPosition, setAvatarEmojiPickerPosition] = useState<{ top: number, left: number } | null>(null);

  const [showAvatarEmojiPicker, setShowAvatarEmojiPicker] = useState(false);
  const [reactBtnPosition, setReactBtnPosition] = useState<{ top: number, left: number }>({ top: 200, left: 20 });
  const reactBtnRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const offset = useRef({ x: 0, y: 0 });
  const wasDragging = useRef(false);



  const recentReactions = useMemo(() => {
    const now = Date.now();

    return Object.entries(emojiReactions)
      .filter(([_, { timestamp }]) => now - timestamp < 8000) // keep reactions within 8 seconds
      .map(([userId, { emoji }]) => {
        const username = usersInSpace[userId]?.username || "Guest";
        return { userId, emoji, username };
      })
      .sort((a, b) => (emojiReactions[b.userId].timestamp - emojiReactions[a.userId].timestamp));
  }, [emojiReactions, usersInSpace]);


  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [chatMessages]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging) return;
 wasDragging.current = true; // ✅ Mark that a drag occurred

      setReactBtnPosition({
        top: e.clientY - offset.current.y,
        left: e.clientX - offset.current.x,
      });
    };

    const handleMouseUp = () => {
      setDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging]);



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
            <Button
              onClick={() => requestFullscreen(document.querySelector("video"))}
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
                  }
                }}
              />
              <Button
                onClick={() => requestFullscreen(document.getElementById(videoId) as HTMLVideoElement)}
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
            const reaction = emojiReactions[user.userId];
            const emoji = reaction?.emoji;


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
                {/* 👇 Add this inside the avatar container */}
                {emoji && (
                  <div
                    key={reaction.timestamp} // 👈 force re-render on new emoji
                    style={{
                      position: "absolute",
                      top: -20,
                      left: SPRITE_WIDTH / 2,
                      transform: "translateX(-50%)",

                      fontSize: "7rem",                // ⬅️ Increased emoji size
                      animation: "fadeOut 5s ease-out forwards", // instead of fadeOut


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
        <Button onClick={() => move(currentPlayerPosition.x, currentPlayerPosition.y - 1)} className="bg-blue-600 px-4 py-2 rounded">↑</Button>
        <Button onClick={() => move(currentPlayerPosition.x - 1, currentPlayerPosition.y)} className="bg-blue-600 px-4 py-2 rounded">←</Button>
        <Button onClick={() => move(currentPlayerPosition.x + 1, currentPlayerPosition.y)} className="bg-blue-600 px-4 py-2 rounded">→</Button>
        <Button onClick={() => move(currentPlayerPosition.x, currentPlayerPosition.y + 1)} className="bg-blue-600 px-4 py-2 rounded">↓</Button>
      </div>
      {/* Standalone Emoji Reaction Button */}
      <div
        ref={reactBtnRef}
        className="fixed z-50 cursor-move"
        style={{
          top: reactBtnPosition.top,
          left: reactBtnPosition.left,
        }}
        onMouseDown={(e) => {
          const rect = reactBtnRef.current?.getBoundingClientRect();
          if (rect) {
            offset.current = {
              x: e.clientX - rect.left,
              y: e.clientY - rect.top,
            };
          }
            wasDragging.current = false; // reset on click
          setDragging(true);
        }}
      >
        <Button
          onClick={(e) => {
             if (wasDragging.current) return; // ✅ Skip if drag just happened
            const rect = (e.target as HTMLElement).getBoundingClientRect();
            setShowAvatarEmojiPicker(true);
            setAvatarEmojiPickerPosition({ top: rect.top - 350, left: rect.left - 200 });
          }}
          className="bg-yellow-500 hover:bg-yellow-600 px-3 py-2 rounded text-black text-lg"
          title="React with Emoji"
        >
          😊 React
        </Button>
      </div>

      {showAvatarEmojiPicker && avatarEmojiPickerPosition && (
        <div
          className="absolute z-50"
          style={{
            top: avatarEmojiPickerPosition.top,
            left: avatarEmojiPickerPosition.left,
            position: "fixed",
          }}
        >
          <Picker
            data={data}
            onEmojiSelect={(emoji: any) => {
              sendEmojiReaction(emoji.native);
              setShowAvatarEmojiPicker(false);
            }}
            theme="dark"
          />
        </div>
      )}



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
            <Button
              onClick={() => setShowChatEmojiPicker((prev) => !prev)}
              className="text-xl bg-gray-700 rounded px-2 hover:bg-gray-600"
              title="Pick Emoji"
            >
              😊
            </Button>

            {/* Emoji Picker Component */}
            {showChatEmojiPicker && (
              <div className="absolute bottom-14 right-12 z-50">
                <Picker
                  data={data}
                  onEmojiSelect={(emoji: any) => {
                    setInputValue((prev) => prev + emoji.native);
                    setShowChatEmojiPicker(false);
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
      {recentReactions.length > 0 && (
        <div className="absolute top-24 left-4 bg-black/70 backdrop-blur-md rounded-md px-4 py-2 text-white shadow z-50 max-w-[200px]">
          <div className="text-sm font-bold mb-1 text-yellow-300">Recent Reactions</div>
          <ul className="space-y-1 text-sm">
            {recentReactions.map((reaction) => (
              <li key={reaction.userId} className="flex items-center gap-2">
                <span className="text-xl">{reaction.emoji}</span>
                <span className="text-white/80 truncate">{reaction.username}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );
};

export default SpacePage;
