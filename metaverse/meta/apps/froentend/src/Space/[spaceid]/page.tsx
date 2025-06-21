import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import useWebSocket from "@/hooks/useWebsocket";
import { Button } from "@/components/ui/button";
import { useVideoCall } from "@/hooks/useVideocall";
import { useMemo } from "react";
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

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const renderedVideos = useMemo(() => {
    return (
      <>
        {localStream && (
          <video
            key="local"
            className="w-40 h-32 border border-white"
            ref={(video) => {
              if (video && video.srcObject !== localStream) {
                video.srcObject = localStream;
                video.autoplay = true;
                video.muted = true;
              }
            }}
          />
        )}
        {peerStreams.map(({ peerId, stream }) => (
          <video
            key={peerId}
            className="w-40 h-32 border border-yellow-500"
            ref={(video) => {
              if (video && video.srcObject !== stream) {
                video.srcObject = stream;
                video.autoplay = true;
              }
            }}
          />
        ))}
      </>
    );
  }, [localStream, peerStreams]);


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentPlayerPosition) return;
      const { x, y } = currentPlayerPosition;

      switch (e.key.toLowerCase()) {
        case "w":
          move(x, y - 1);
          break;
        case "a":
          move(x - 1, y);
          break;
        case "s":
          move(x, y + 1);
          break;
        case "d":
          move(x + 1, y);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentPlayerPosition, move]);

  if (!isConnected || !map || !currentPlayerPosition) {
    return <div className="text-white text-center mt-10">Connecting to space...</div>;
  }

  return (
    <div className="h-screen w-screen flex bg-black text-white">
      {/* 70% Map Area */}
      <div className="w-[70%] p-4 overflow-auto">
        <div
          className="inline-block relative"
          style={{
            width: `${map[0].length * TILE_SIZE}px`,
            height: `${map.length * TILE_SIZE}px`,
            backgroundImage: "url('/maps/m4.png')",
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            imageRendering: "pixelated",
          }}
        >
          {/* Map Elements */}
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

          {/* Players */}
          {Object.values(usersInSpace).map((user) => {
            const frame = user.frame ?? 0;
            const direction = user.direction ?? "down";
            const rowMap = {
              down: 0,
              left: 1,
              right: 2,
              up: 3,
            } as const;
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

        {/* Movement Buttons */}
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={() => move(currentPlayerPosition.x, currentPlayerPosition.y - 1)} className="bg-blue-600 px-3 py-2 rounded">Up</button>
          <button onClick={() => move(currentPlayerPosition.x - 1, currentPlayerPosition.y)} className="bg-blue-600 px-3 py-2 rounded">Left</button>
          <button onClick={() => move(currentPlayerPosition.x + 1, currentPlayerPosition.y)} className="bg-blue-600 px-3 py-2 rounded">Right</button>
          <button onClick={() => move(currentPlayerPosition.x, currentPlayerPosition.y + 1)} className="bg-blue-600 px-3 py-2 rounded">Down</button>
        </div>

        {/* Video Buttons */}
        <div className="mt-6 flex justify-center gap-2">
          <Button onClick={startVideo} className="bg-green-600">Start Video</Button>
          <Button onClick={stopVideo} className="bg-red-600">Stop Video</Button>
        </div>

        {/* Local & Remote Video */}
        <div className="mt-4 flex gap-2 flex-wrap">
          {renderedVideos}
        </div>
      </div>

      {/* 30% Chat Area */}
      <div className="w-[30%] h-full flex flex-col border-l border-gray-700 p-4">
        <div ref={chatBoxRef} className="flex-1 overflow-y-auto bg-gray-900 rounded-lg p-3 mb-3">
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
          <Button
            onClick={() => {
              if (inputValue.trim()) {
                sendChatMessage(inputValue);
                setInputValue("");
              }
            }}
            className="bg-blue-600 px-4 py-2"
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SpacePage;
