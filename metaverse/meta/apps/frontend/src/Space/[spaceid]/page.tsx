import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams } from "react-router-dom";
import useWebSocket from "@/hooks/useWebsocket";
import { Button } from "@/components/ui/button";
import { useVideoCall } from "@/hooks/useVideocall";
import { Fullscreen, VideoOff } from "lucide-react";
import VideoPanel from "@/components/VideoPanel";
import ChatPanel from "@/components/Chatpanel";
import MapCanvas from "@/components/Mapcanvas";
import { Canvas } from "@/components/Canvas";
import 'react-resizable/css/styles.css';


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
    currentPlayerPosition,
    chatMessages,
    sendChatMessage,
    userId: currentUserId,
    ws,
    emojiReactions,
    typingUsers,
  onTyping
  } = useWebSocket(spaceId ?? "");

  const {
    startVideo,
    stopVideo,
    localStream,
    peerStreams,
    startScreenShare,
    isScreenSharing
  } = useVideoCall(ws, currentUserId!);

  const chatBoxRef = useRef<HTMLDivElement>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastReadMessageCount = useRef<number>(0);

  const [isVideoOpen, setIsVideoOpen] = useState(false);// New state for avatar emoji picker position only
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const [showCanvas, setShowCanvas] = useState(false);

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
  //
useEffect(() => {
  const newMessages = chatMessages.length - lastReadMessageCount.current;
  if (!isChatOpen && newMessages > 0) {
    setUnreadCount(newMessages);
  }
}, [chatMessages, isChatOpen]);

//Also reset when chat opens:
useEffect(() => {
  if (isChatOpen) {
    lastReadMessageCount.current = chatMessages.length;
    setUnreadCount(0);
  }
}, [isChatOpen, chatMessages]);





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
      {/* Standalone Emoji Reaction Button */}

    <div
  className="fixed z-50 bottom-11 left-[28rem]">

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
        <Button
          onClick={startScreenShare}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          🖥 Share Screen
        </Button>
      </div>
  <button
        onClick={() => setShowCanvas((prev) => !prev)}
        className="fixed top-20 left-4 z-50 bg-blue-600 px-4 py-2 rounded"
      >
        {showCanvas ? "Close Drawing Canvas" : "Open Drawing Canvas"}
      </button>

      {showCanvas && (
        <div className="absolute inset-0 z-30">
          <Canvas spaceId={spaceId ?? ""} />
        </div>
      )}

      {isVideoOpen && (
        //pointer-events-none will let children opt-in to interaction, and fixed lets them move anywhere on the screen.
        <div className="fixed inset-0 z-50 pointer-events-none">
          <VideoPanel
            localStream={localStream}
            peerStreams={peerStreams}
            usersInSpace={usersInSpace}
            localVideoRef={localVideoRef}
            isScreenSharing={isScreenSharing}
          />
        </div>
      )}

      <Button
  onClick={() => setIsChatOpen(!isChatOpen)}
  className="absolute top-4 right-4 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full z-50"
>
  {/* Replace the emoji with an <img> tag */}
  <img 
    src="/maps/chat.png" // Path to your image in the public folder
    alt="Open Chat" 
    className="w-6 h-6" // Adjust width and height as needed
  />

  {unreadCount > 0 && (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 rounded-full">
      {unreadCount}
    </span>
  )}
</Button>
      {isChatOpen && (
        <ChatPanel
          isOpen={true}
          messages={chatMessages}
          currentUserId={currentUserId!}
          users={usersInSpace}
          typingUsers={typingUsers}
          onTyping={onTyping}
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
    </div>
  );
};

export default SpacePage;
