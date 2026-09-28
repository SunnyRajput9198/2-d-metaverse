import React, { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Fullscreen, VideoOff } from "lucide-react";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import useWebSocket from "@/hooks/useWebsocket";
import { useLiveKit } from "@/hooks/useLivekit";
import { Button } from "@/components/ui/button";
import ChatPanel from "@/components/Chatpanel";
import MapCanvas from "@/components/Mapcanvas";
import { Minimap } from "@/components/minimap";

const ExcalidrawWrapper = lazy(() => import("@/components/Excelidrawwrapper"));
const LiveKitCall = lazy(() => import("@/components/LiveKitCall"));

const SpacePage: React.FC = () => {
  const { spaceId } = useParams<{ spaceId: string }>();
  const {
    isConnected, usersInSpace, map, spaceElements, move, currentPlayerPosition,
    chatMessages, sendChatMessage, userId: currentUserId, emojiReactions, typingUsers,
    onTyping, sendEmojiReaction, excalidrawElements, sendCanvasUpdate,
  } = useWebSocket(spaceId ?? "");
  const liveKit = useLiveKit(spaceId ?? "");
  const liveKitToken = liveKit.token;
  const disconnectLiveKit = liveKit.disconnect;

  const [isChatOpen, setIsChatOpen] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isVideoMinimized, setIsVideoMinimized] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const lastReadMessageCount = useRef(0);

  const recentReactions = useMemo(() => Object.entries(emojiReactions)
    .filter(([, reaction]) => Date.now() - reaction.timestamp < 8000)
    .map(([userId, reaction]) => ({ userId, emoji: reaction.emoji, username: usersInSpace[userId]?.username || "Guest" }))
    .sort((a, b) => emojiReactions[b.userId].timestamp - emojiReactions[a.userId].timestamp), [emojiReactions, usersInSpace]);

  useEffect(() => {
    const newMessages = chatMessages.length - lastReadMessageCount.current;
    if (!isChatOpen && newMessages > 0) setUnreadCount(newMessages);
    if (isChatOpen) { lastReadMessageCount.current = chatMessages.length; setUnreadCount(0); }
  }, [chatMessages, isChatOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!currentPlayerPosition || showCanvas || ["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName ?? "")) return;
      const { x, y } = currentPlayerPosition;
      const destination = ({ ArrowUp: [x, y - 1], w: [x, y - 1], W: [x, y - 1], ArrowLeft: [x - 1, y], a: [x - 1, y], A: [x - 1, y], ArrowRight: [x + 1, y], d: [x + 1, y], D: [x + 1, y], ArrowDown: [x, y + 1], s: [x, y + 1], S: [x, y + 1] } as Record<string, [number, number]>)[event.key];
      if (destination) move(...destination);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPlayerPosition, move, showCanvas]);

  const startVideo = async () => {
    if (await liveKit.connect()) setIsVideoMinimized(false);
  };
  const endVideo = () => { liveKit.disconnect(); setIsVideoMinimized(false); };
  const toggleFullscreen = () => document.fullscreenElement ? document.exitFullscreen?.() : document.documentElement.requestFullscreen?.();

  useEffect(() => {
    if (!isConnected && liveKitToken) {
      disconnectLiveKit();
      setIsVideoMinimized(false);
    }
  }, [disconnectLiveKit, isConnected, liveKitToken]);

  if (!isConnected || !map || !currentPlayerPosition) return <div className="mt-10 text-center text-white">Connecting to space...</div>;

  const videoIsActive = Boolean(liveKitToken && liveKit.livekitUrl);
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0c0c0c] text-white">
      {!showCanvas && <>
        <main className={`flex h-full items-center justify-center transition-all duration-300 ${isChatOpen ? "pr-96" : "w-full"}`}>
          <MapCanvas map={map} spaceElements={spaceElements} usersInSpace={usersInSpace} emojiReactions={emojiReactions} currentUserId={currentUserId ?? undefined} />
        </main>

        <aside className="absolute right-3 top-16 z-40 sm:right-4"><Minimap users={usersInSpace} currentUserId={currentUserId} mapWidth={map[0]?.length ?? 0} mapHeight={map.length} /></aside>

        <div className="absolute bottom-20 left-1/2 z-40 flex -translate-x-1/2 gap-1.5 rounded-xl border border-white/10 bg-slate-950/70 p-1.5 shadow-lg backdrop-blur">
          <Button onClick={() => move(currentPlayerPosition.x, currentPlayerPosition.y - 1)} className="bg-blue-600 px-3 py-2">↑</Button><Button onClick={() => move(currentPlayerPosition.x - 1, currentPlayerPosition.y)} className="bg-blue-600 px-3 py-2">←</Button><Button onClick={() => move(currentPlayerPosition.x + 1, currentPlayerPosition.y)} className="bg-blue-600 px-3 py-2">→</Button><Button onClick={() => move(currentPlayerPosition.x, currentPlayerPosition.y + 1)} className="bg-blue-600 px-3 py-2">↓</Button>
        </div>

        <div className="fixed bottom-6 left-4 z-50"><Button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="bg-yellow-500 text-black hover:bg-yellow-400">😊 React</Button>{showEmojiPicker && <div className="absolute bottom-12 left-0"><Picker data={data} theme="dark" onEmojiSelect={(emoji: { native: string }) => { sendEmojiReaction(emoji.native); setShowEmojiPicker(false); }} /></div>}</div>

        <Button onClick={() => setIsChatOpen(!isChatOpen)} className="absolute right-4 top-4 z-50 rounded-full bg-slate-800 p-2 hover:bg-slate-700"><img src="/maps/chat.png" alt="Open chat" className="h-6 w-6" />{unreadCount > 0 && <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1 text-xs">{unreadCount}</span>}</Button>
        {isChatOpen && <ChatPanel isOpen messages={chatMessages} currentUserId={currentUserId ?? ""} users={usersInSpace} typingUsers={typingUsers} onTyping={onTyping} onSend={sendChatMessage} _onClose={() => setIsChatOpen(false)} />}

        {recentReactions.length > 0 && <div className="absolute left-4 top-20 z-40 max-w-48 rounded-lg bg-black/65 px-3 py-2 text-sm shadow backdrop-blur"><p className="mb-1 text-xs font-bold text-yellow-300">Recent reactions</p>{recentReactions.map((reaction) => <p key={reaction.userId}>{reaction.emoji} <span className="text-white/80">{reaction.username}</span></p>)}</div>}

        <div className="absolute left-4 top-4 z-50 flex gap-2"><Button onClick={() => void startVideo()} disabled={liveKit.isRequestingToken || videoIsActive} className="bg-emerald-600 hover:bg-emerald-500">{liveKit.isRequestingToken ? "Starting…" : "🎥 Start Video"}</Button>{videoIsActive && <Button onClick={endVideo} className="flex gap-2 bg-red-600 hover:bg-red-500"><VideoOff className="h-4 w-4" />End video</Button>}<Button onClick={toggleFullscreen} className="flex gap-2 bg-slate-700"><Fullscreen className="h-4 w-4" />Fullscreen</Button></div>
        <Button onClick={() => setShowCanvas(true)} className="fixed left-4 top-16 z-50 bg-blue-600">Open Drawing Canvas</Button>
      </>}

      {showCanvas && <><div className="fixed left-4 top-4 z-[1002]"><Button onClick={() => void startVideo()} disabled={liveKit.isRequestingToken || videoIsActive} className="bg-emerald-600">{liveKit.isRequestingToken ? "Starting…" : "🎥 Start Video"}</Button></div><Suspense fallback={<div className="fixed inset-0 z-[1000] grid place-items-center bg-slate-950 text-white">Loading canvas…</div>}><ExcalidrawWrapper onClose={() => setShowCanvas(false)} excalidrawElements={excalidrawElements} sendCanvasUpdate={sendCanvasUpdate} /></Suspense></>}

      {liveKit.error && <div role="alert" className="fixed bottom-4 left-1/2 z-[1100] w-[min(92vw,520px)] -translate-x-1/2 rounded-xl border border-rose-300/30 bg-rose-950/95 px-4 py-3 text-sm text-rose-100 shadow-xl">Video call: {liveKit.error}</div>}
      {videoIsActive && <Suspense fallback={null}><LiveKitCall token={liveKitToken!} serverUrl={liveKit.livekitUrl!} minimized={isVideoMinimized} onMinimize={() => setIsVideoMinimized(!isVideoMinimized)} onEnd={endVideo} onError={liveKit.setError} /></Suspense>}
    </div>
  );
};

export default SpacePage;
