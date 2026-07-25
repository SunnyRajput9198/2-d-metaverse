import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import useWebSocket from "@/hooks/useWebsocket";
import { Button } from "@/components/ui/button";
import { useLiveKit } from "@/hooks/useLivekit";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import "@livekit/components-styles";
import { Fullscreen, VideoOff, Video, Mic, MicOff, PhoneOff } from "lucide-react";
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import ChatPanel from "@/components/Chatpanel";
import MapCanvas from "@/components/Mapcanvas";
import { Minimap } from "@/components/minimap";
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';
import ExcalidrawWrapper from "@/components/Excelidrawwrapper";

// Local Webcam Fallback Component when LiveKit media server (port 7880) is offline
function LocalWebcamFallback({ onClose }: { onClose?: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    navigator.mediaDevices
      ?.getUserMedia({ video: true, audio: true })
      .then((s) => {
        activeStream = s;
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      })
      .catch((err) => {
        setCameraError(err.message || "Webcam access denied or unavailable");
      });

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const toggleMic = () => {
    if (!stream) return;
    const audioTracks = stream.getAudioTracks();
    audioTracks.forEach((track) => {
      track.enabled = !isMicOn;
    });
    setIsMicOn(!isMicOn);
  };

  const toggleVideo = () => {
    if (!stream) return;
    const videoTracks = stream.getVideoTracks();
    videoTracks.forEach((track) => {
      track.enabled = !isVideoOn;
    });
    setIsVideoOn(!isVideoOn);
  };

  return (
    <div className="relative w-full h-full bg-gray-950 flex flex-col items-center justify-center p-2 text-white">
      {/* Video Feed or Muted Placeholder */}
      {isVideoOn ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover rounded-lg transform -scale-x-100 border border-emerald-500/30"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 rounded-lg border border-gray-700">
          <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-2xl font-bold mb-2 shadow-lg">
            👤
          </div>
          <span className="text-xs text-gray-400 font-semibold">Camera Off</span>
        </div>
      )}

      {/* Top Banner Notice */}
      <div className="absolute top-2 left-2 right-2 bg-black/80 backdrop-blur-md text-amber-300 text-[11px] font-semibold px-2.5 py-1 rounded-md border border-amber-500/40 z-20 flex items-center justify-between shadow">
        <span>📹 Local Media Controls</span>
      </div>

      {cameraError && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-4 text-center text-red-400 text-xs z-30">
          ⚠️ {cameraError}
        </div>
      )}

      {/* Bottom Media Control Bar (Mic Mute/Unmute, Camera On/Off, Close) */}
      <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex items-center gap-3 bg-black/85 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 shadow-2xl z-30">
        {/* Mic Toggle */}
        <button
          onClick={toggleMic}
          className={`p-2.5 rounded-full transition-all duration-200 shadow ${
            isMicOn
              ? "bg-gray-700 hover:bg-gray-600 text-white"
              : "bg-red-600 hover:bg-red-700 text-white ring-2 ring-red-400/50 animate-pulse"
          }`}
          title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
        >
          {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </button>

        {/* Camera Toggle */}
        <button
          onClick={toggleVideo}
          className={`p-2.5 rounded-full transition-all duration-200 shadow ${
            isVideoOn
              ? "bg-gray-700 hover:bg-gray-600 text-white"
              : "bg-red-600 hover:bg-red-700 text-white ring-2 ring-red-400/50"
          }`}
          title={isVideoOn ? "Turn Camera Off" : "Turn Camera On"}
        >
          {isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
        </button>

        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white shadow transition-all duration-200"
            title="End Call"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// Resilient LiveKit Video Container with Fallback
function VideoCallContainer({
  token,
  serverUrl,
  onClose,
}: {
  token: string;
  serverUrl: string;
  onClose: () => void;
}) {
  const [hasConnectionError, setHasConnectionError] = useState(false);

  if (hasConnectionError) {
    return <LocalWebcamFallback onClose={onClose} />;
  }

  return (
    <LiveKitRoom
      token={token}
      serverUrl={serverUrl}
      connect={true}
      video={true}
      audio={true}
      data-lk-theme="default"
      onError={(err) => {
        console.warn("[LiveKit] Media server offline, switching to local webcam fallback:", err);
        setHasConnectionError(true);
      }}
      style={{ height: "100%" }}
    >
      <VideoConference />
    </LiveKitRoom>
  );
}

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
    typingUsers,
    onTyping,
    sendEmojiReaction,
    excalidrawElements,
    sendCanvasUpdate
  } = useWebSocket(spaceId ?? "");

  const {
    token: livekitToken,
    livekitUrl,
    connect: connectLiveKit,
    disconnect: disconnectLiveKit,
  } = useLiveKit(spaceId ?? "");

  const [isChatOpen, setIsChatOpen] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastReadMessageCount = useRef<number>(0);

  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [avatarEmojiPickerPosition, setAvatarEmojiPickerPosition] = useState<{ top: number, left: number } | null>(null);
  const [showAvatarEmojiPicker, setShowAvatarEmojiPicker] = useState(false);
  const [showCanvas, setShowCanvas] = useState(false);

  const recentReactions = useMemo(() => {
    const now = Date.now();

    return Object.entries(emojiReactions)
      .filter(([_, { timestamp }]) => now - timestamp < 8000)
      .map(([userId, { emoji }]) => {
        const username = usersInSpace[userId]?.username || "Guest";
        return { userId, emoji, username };
      })
      .sort((a, b) => (emojiReactions[b.userId].timestamp - emojiReactions[a.userId].timestamp));
  }, [emojiReactions, usersInSpace]);

  useEffect(() => {
    const newMessages = chatMessages.length - lastReadMessageCount.current;
    if (!isChatOpen && newMessages > 0) {
      setUnreadCount(newMessages);
    }
  }, [chatMessages, isChatOpen]);

  useEffect(() => {
    if (isChatOpen) {
      lastReadMessageCount.current = chatMessages.length;
      setUnreadCount(0);
    }
  }, [isChatOpen, chatMessages]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentPlayerPosition || showCanvas) return;

      // Ignore key events when user is typing in a form input or textarea
      const activeElement = document.activeElement;
      if (
        activeElement &&
        (activeElement.tagName === "INPUT" || activeElement.tagName === "TEXTAREA")
      ) {
        return;
      }

      const { x, y } = currentPlayerPosition;

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          move(x, y - 1);
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          move(x - 1, y);
          break;
        case "ArrowRight":
        case "d":
        case "D":
          move(x + 1, y);
          break;
        case "ArrowDown":
        case "s":
        case "S":
          move(x, y + 1);
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentPlayerPosition, move, showCanvas]);

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
    <div className="relative h-screen w-screen bg-[#0c0c0c] text-white overflow-hidden">
      {/* All elements that should disappear when the canvas is open */}
      {!showCanvas && (
        <>
          {/* Render map & avatars via MapCanvas - Expands to touch message box */}
          <div className={`flex items-center justify-center h-full transition-all duration-300 ${isChatOpen ? "pr-96" : "w-full"}`}>
            <MapCanvas
              map={map}
              spaceElements={spaceElements}
              usersInSpace={usersInSpace}
              emojiReactions={emojiReactions}
              currentUserId={currentUserId!}
            />
          </div>

          {/* Minimap */}
          <div className="absolute top-11 right-[28rem] z-50">
            <ResizableBox
              width={150}
              height={150}
              minConstraints={[100, 100]}
              maxConstraints={[200, 200]}
              resizeHandles={['sw']}
            >
              <Minimap
                users={Object.values(usersInSpace).map((u) => ({
                  id: u.id,
                  username: u.username,
                  x: u.x ?? 0,
                  y: u.y ?? 0,
                }))}
                mapWidth={map[0]?.length ?? 0}
                mapHeight={map.length ?? 0}
              />
            </ResizableBox>
          </div>

          {/* Movement Buttons */}
          <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 flex gap-2 z-40">
            <Button onClick={() => move(currentPlayerPosition.x, currentPlayerPosition.y - 1)} className="bg-blue-600 px-4 py-2 rounded">↑</Button>
            <Button onClick={() => move(currentPlayerPosition.x - 1, currentPlayerPosition.y)} className="bg-blue-600 px-4 py-2 rounded">←</Button>
            <Button onClick={() => move(currentPlayerPosition.x + 1, currentPlayerPosition.y)} className="bg-blue-600 px-4 py-2 rounded">→</Button>
            <Button onClick={() => move(currentPlayerPosition.x, currentPlayerPosition.y + 1)} className="bg-blue-600 px-4 py-2 rounded">↓</Button>
          </div>

          {/* Standalone Emoji Reaction Button & Picker */}
          <div className="fixed z-50 bottom-11 left-[28rem]">
            <Button
              onClick={(e) => {
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

          {/* Chat Button */}
          <Button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="absolute top-4 right-4 bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full z-50"
          >
            <img
              src="/maps/chat.png"
              alt="Open Chat"
              className="w-6 h-6"
            />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </Button>

          {/* Chat Panel */}
          {isChatOpen && (
            <ChatPanel
              isOpen={true}
              messages={chatMessages}
              currentUserId={currentUserId!}
              users={usersInSpace}
              typingUsers={typingUsers}
              onTyping={onTyping}
              onSend={handleSendMessage}
              _onClose={() => setIsChatOpen(false)}
            />
          )}

          {/* Recent Reactions Panel */}
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

          {/* Normal Controls Area (when canvas is closed) */}
          <div className="absolute top-4 left-4 flex gap-2 z-50">
            {!isVideoOpen && (
              <Button onClick={() => { connectLiveKit(); setIsVideoOpen(true); }} className="bg-green-600">🎥 Start Video</Button>
            )}
            {isVideoOpen && (
              <Button onClick={() => { disconnectLiveKit(); setIsVideoOpen(false); }} className="bg-red-600 flex items-center gap-2">
                <VideoOff className="w-4 h-4" /> Stop Video
              </Button>
            )}

            <Button onClick={toggleFullscreen} className="bg-gray-700 flex items-center gap-2">
              <Fullscreen className="w-4 h-4" /> Fullscreen
            </Button>
          </div>

          {/* Canvas Button (when canvas is closed) */}
          <Button
            onClick={() => setShowCanvas(true)}
            className="fixed top-20 left-38 z-50 bg-blue-600 px-4 py-2 rounded"
          >
            Open Drawing Canvas
          </Button>
        </>
      )}

      {/* Canvas Controls (when canvas is open) - Only Video */}
      {showCanvas && (
        <div className="fixed top-4 left-4 z-[1002] flex gap-2">
          {!isVideoOpen ? (
            <Button
              onClick={() => { connectLiveKit(); setIsVideoOpen(true); }}
              className="bg-green-600 hover:bg-green-700"
            >
              🎥 Start Video
            </Button>
          ) : (
            <Button
              onClick={() => { disconnectLiveKit(); setIsVideoOpen(false); }}
              className="bg-red-600 hover:bg-red-700 flex items-center gap-2"
            >
              <VideoOff className="w-4 h-4" /> Stop Video
            </Button>
          )}
        </div>
      )}

      {/* Canvas (covers screen when active) */}
      {showCanvas && (
        <ExcalidrawWrapper
          onClose={() => setShowCanvas(false)}
          excalidrawElements={excalidrawElements}
          sendCanvasUpdate={sendCanvasUpdate}
        />
      )}

      {/* Video Panel with Resilient LiveKit Room & Fallback */}
      {isVideoOpen && livekitToken && livekitUrl && (
        <div className="fixed bottom-4 left-4 z-[1001] w-[420px] h-[310px] bg-gray-900 border-2 border-emerald-500/80 rounded-xl overflow-hidden shadow-2xl">
          <VideoCallContainer
            token={livekitToken}
            serverUrl={livekitUrl}
            onClose={() => {
              disconnectLiveKit();
              setIsVideoOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default SpacePage;