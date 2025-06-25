// components/ChatPanel.tsx

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";

type ChatMessage = {
  userId: string;
  message: string;
};

type User = {
  username: string;
};

interface ChatPanelProps {
  isOpen: boolean;
  messages: ChatMessage[];
  currentUserId: string;
  users: Record<string, User>;
  onSend: (msg: string) => void;
  onClose: () => void;
}

const ChatPanel: React.FC<ChatPanelProps> = ({
  isOpen,
  messages,
  currentUserId,
  users,
  onSend,
  onClose
}) => {
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-0 h-full w-[300px] bg-gray-900 border-l border-gray-700 p-4 flex flex-col z-40">
      <div
        ref={chatBoxRef}
        className="flex-1 overflow-y-auto bg-gray-800 rounded-lg p-3 mb-3"
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-2 flex ${msg.userId === currentUserId ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[70%] px-3 py-2 rounded-lg text-sm ${msg.userId === currentUserId ? "bg-blue-600 text-white" : "bg-gray-700 text-white"}`}
            >
              <div className="font-semibold text-xs opacity-80 mb-1">
                {users[msg.userId]?.username || "Anonymous"}
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
              onSend(inputValue);
              setInputValue("");
            }
          }}
        />
        <Button
          onClick={() => setShowEmojiPicker((prev) => !prev)}
          className="text-xl bg-gray-700 rounded px-2 hover:bg-gray-600"
          title="Pick Emoji"
        >
          😊
        </Button>

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
              onSend(inputValue);
              setInputValue("");
            }
          }}
          className="bg-blue-600 px-4 py-2"
        >
          Send
        </Button>
      </div>
    </div>
  );
};

export default ChatPanel;
