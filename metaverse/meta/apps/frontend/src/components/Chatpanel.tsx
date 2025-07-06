// components/ChatPanel.tsx

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import { marked } from "marked";
import type { RendererObject } from "marked";
import DOMPurify from "dompurify";

type ChatMessage = {
  userId: string;
  message: string;
  timestamp: number; // UNIX epoch (ms)
};

const renderer: RendererObject = {
  link({ href, title, text }) {
    if (!href) return text;
    console.log("Rendering link:", href); // 👈 check this runs
    const safeHref = DOMPurify.sanitize(href);
    const safeTitle = title ? ` title="${DOMPurify.sanitize(title)}"` : "";

    return `<a href="${safeHref}"${safeTitle} target="_blank" rel="noopener noreferrer" ...>${text}</a>`;

  },
};

// Register renderer
marked.use({ renderer });
const linkify = (text: string): string => {
  // Don't double wrap markdown links
  const mdLinkRegex = /\[.*?\]\(.*?\)/g;
  if (mdLinkRegex.test(text)) return text;

  // Otherwise, auto-link plain URLs
  const urlRegex = /((https?:\/\/[^\s<]+[^<.,:;"')\]\s]))/g;
  return text.replace(urlRegex, (url) => `[${url}](${url})`);
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
  typingUsers: Record<string, number>; // 👈 add this
  onTyping: () => void; // 👈 add this

}

console.log(marked.parse(linkify("https://google.com")));

const ChatPanel: React.FC<ChatPanelProps> = ({
  isOpen,
  messages,
  currentUserId,
  users,
  onSend,
  onClose,
  typingUsers,
  onTyping
}) => {
  const chatBoxRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
const [searchTerm, setSearchTerm] = useState("");

const filteredMessages = messages.filter((msg) =>
  msg.message.toLowerCase().includes(searchTerm.toLowerCase())
);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-0 h-full w-[300px] bg-gray-900 border-l border-gray-700 p-4 flex flex-col z-40">
      <input
  type="text"
  placeholder="Search messages..."
  className="mb-3 px-3 py-2 rounded bg-gray-700 text-white w-full outline-none"
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
/>
      <div
        ref={chatBoxRef}
        className="flex-1 overflow-y-auto bg-gray-800 rounded-lg p-3 mb-3 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 "
      >
        {filteredMessages.map((msg, index) => (
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
              <div
                className="text-sm leading-snug break-words whitespace-pre-wrap"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(marked.parse(linkify(msg.message)) as string),
                }}
              />

              <div className="text-xs opacity-60 mt-1 text-right">
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>

            </div>
          </div>
        ))}
      </div>

      <div className="text-xs text-gray-400 mt-1">
        Markdown supported: <code>**bold**</code>, <code>_italic_</code>, <code>`code`</code>
      </div>
      {Object.keys(typingUsers)
  .filter((id) => id !== currentUserId)
  .map((id) => (
    <div key={id} className="text-xs text-gray-400 mb-1">
      {users[id]?.username || "Someone"} is typing...
    </div>
))}

      <div className="flex items-center gap-2">

        <input
          type="text"
          className="flex-1 px-3 py-2 rounded bg-gray-800 text-white outline-none"
          placeholder="Say something..."
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            onTyping(); // 👈 notify parent
          }}
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
