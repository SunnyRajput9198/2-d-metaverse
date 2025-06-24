import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams } from "react-router-dom";
import useWebSocket from "@/hooks/useWebsocket";
import { Button } from "@/components/ui/button";
import { useVideoCall } from "@/hooks/useVideocall";
import { Fullscreen, VideoOff } from "lucide-react";
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { useHandGesture } from "@/hooks/useHandgesture";
import FloatingEmoji from "@/components/FloatingEmoji";
import VideoPanel from "@/components/VideoPanel";
import ChatPanel from "@/components/Chatpanel";
import MapCanvas from "@/components/Mapcanvas";

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

  const chatBoxRef = useRef<HTMLDivElement>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  // New state for avatar emoji picker position only
  const [avatarEmojiPickerPosition, setAvatarEmojiPickerPosition] = useState<{ top: number, left: number } | null>(null);

  const [showAvatarEmojiPicker, setShowAvatarEmojiPicker] = useState(false);
  const [reactBtnPosition, setReactBtnPosition] = useState<{ top: number, left: number }>({ top: 200, left: 20 });
  const reactBtnRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const offset = useRef({ x: 0, y: 0 });
  const wasDragging = useRef(false);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  const [floatingEmojis, setFloatingEmojis] = useState<
    { id: string; emoji: string; x: number; y: number }[]
  >([]);

  const triggerFloatingEmoji = (emoji: string, x: number, y: number) => {
    const id = `${Date.now()}-${Math.random()}`;
    setFloatingEmojis((prev) => [...prev, { id, emoji, x, y }]);
  };

  const handleFloatingEmojiComplete = (id: string) => {
    setFloatingEmojis((prev) => prev.filter((e) => e.id !== id));
  };
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
  useHandGesture(localVideoRef, (gesture) => {
    const emojiMap = {
      thumbs_up: "👍",
      heart: "❤️",
    };
    const emoji = emojiMap[gesture];
    if (emoji) {
      sendEmojiReaction(emoji);
    }
    const localVideo = localVideoRef.current;
    if (localVideo) {
      const rect = localVideo.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top;
      triggerFloatingEmoji(emoji, x, y);
    }
  });

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
  const handleSendMessage = (msg: string) => {
    sendChatMessage(msg);
  };
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
      {/* Render map & avatars via MapCanvas */}
    <div className="flex items-center justify-center h-full">
      <MapCanvas
        map={map}
        spaceElements={spaceElements}
        usersInSpace={usersInSpace}
        emojiReactions={emojiReactions}
        currentPlayerPosition={currentPlayerPosition}
        TILE_SIZE={TILE_SIZE}
        SPRITE_WIDTH={SPRITE_WIDTH}
        SPRITE_HEIGHT={SPRITE_HEIGHT}
      />
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
          <VideoPanel
            localStream={localStream}
            peerStreams={peerStreams}
            usersInSpace={usersInSpace}
            localVideoRef={localVideoRef}
          />
        </div>
      )}


      <Button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="absolute top-4 right-4 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full z-50"
      >💬</Button>

      {isChatOpen && (
        <ChatPanel
          isOpen={true}
          messages={chatMessages}
          currentUserId={currentUserId!}
          users={usersInSpace}
          onSend={handleSendMessage}
          onClose={() => setIsChatOpen(false)}
        />
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
      {floatingEmojis.map(({ id, emoji, x, y }) => (
        <FloatingEmoji
          key={id}
          id={id}
          emoji={emoji}
          x={x}
          y={y}
          onComplete={handleFloatingEmojiComplete}
        />
      ))}

    </div>
  );
};

export default SpacePage;
