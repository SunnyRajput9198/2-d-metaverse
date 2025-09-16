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
  username: string;
  timestamp: number; // UNIX epoch (ms)

};

const renderer: RendererObject = {

  link({ href, title, text }) {
    if (!href) return text;
    console.log("Rendering link:", href); // 👈 check this runs
    const safeHref = DOMPurify.sanitize(href);
    const safeTitle = title ? ` title="${DOMPurify.sanitize(title)}"` : "";

    return `<a href="${safeHref}"${safeTitle} target="_blank" rel="noopener noreferrer">${text}</a>`;

  },
};
const handleLinkClick = (e: React.MouseEvent<HTMLDivElement>) => {
  const el = e.target as HTMLElement;
  if (el.tagName === "A" && el.getAttribute("href")) {
    e.preventDefault();
    window.open(el.getAttribute("href")!, "_blank", "noopener,noreferrer");
  }
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
  onSend: (msg: string, userId?: string) => void;
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
   const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  // --- NEW: State to track if a message is currently being sent ---
  const [isSending, setIsSending] = useState(false);

  const filteredMessages = messages.filter((msg) =>
    msg.message.toLowerCase().includes(searchTerm.toLowerCase())
  );
 // --- NEW: Helper function to generate the grouped typing indicator text ---
  const getTypingIndicatorText = () => {
    const typingUserIds = Object.keys(typingUsers).filter(id => id !== currentUserId);
    const numTyping = typingUserIds.length;

    if (numTyping === 0) {
      return null;
    }

    const names = typingUserIds.map(id => users[id]?.username || "Someone");

    if (numTyping === 1) {
      return `${names[0]} is typing...`;
    }
    if (numTyping === 2) {
      return `${names[0]} and ${names[1]} are typing...`;
    }
    return "Several people are typing...";
  };

  const typingIndicator = getTypingIndicatorText();
  useEffect(() => {
    setIsSending(false);
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);
  // --- NEW: Effect to auto-focus the input when the panel opens ---
  useEffect(() => {
    if (isOpen) {
      // Use a short timeout to ensure the element is rendered before focusing
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);
  // --- NEW: Centralized function to handle sending a message ---
  const handleSendMessage = () => {
    if (inputValue.trim() && !isSending) {
      setIsSending(true);
      onSend(inputValue, currentUserId);
      setInputValue("");
    }
  };
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-0 h-full w-[370px] bg-[#24cfa6] border-l border-gray-700 p-4 flex flex-col z-40">
      <input
        type="text"
        placeholder="Search messages..."
        className="mb-3 px-3 py-2 rounded bg-black text-white w-full outline-none"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div
        ref={chatBoxRef}
        className="flex-1 overflow-y-auto bg-black rounded-lg p-3 mb-3 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 "
        onClick={handleLinkClick}  // <-- Add this line here
      >
        {filteredMessages.map((msg, index) => (
          <div
            key={index}
            className={`mb-1 flex ${msg.userId === currentUserId ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[70%] px-3 py-2 rounded-xl text-sm ${msg.userId === currentUserId ? "bg-gray-200 text-black" :"bg-gray-200 text-black"}`}
            >
              <div className="font-semibold text-xs opacity-80 ">
                {msg.username || "Anonymous"}
              </div>
              <div
                className="text-sm leading-snug break-words whitespace-pre-wrap"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(marked.parse(linkify(msg.message)) as string),
                }}
              />

              <div className="text-xs opacity-60 text-right">
                {new Date(msg.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>

            </div>
          </div>
        ))}
      </div>

      <div className="text-xs text-black mt-1">
        Markdown supported: <code>**bold**</code>, <code>_italic_</code>, <code>`code`</code>
      </div>
       {/* --- NEW: Render the single, grouped typing indicator --- */}
      {typingIndicator && (
        <div className="text-xs text-gray-400 h-4 mb-1">
          {typingIndicator}
        </div>
      )}
      {/* If no one is typing, we render an empty div to prevent layout shifts */}
      {!typingIndicator && <div className="h-4 mb-1" />}

      <div className="flex items-center gap-2">

        <input
          ref={inputRef}
          type="text"
           className={`flex-1 px-3 py-2 rounded bg-black text-white outline-none ${isSending ? 'opacity-50 cursor-not-allowed' : ''}`}
          placeholder="Say something..."
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            onTyping(); // 👈 notify parent
          }}
          onKeyDown={(e) => {
            // --- FIXED: Use the centralized handler ---
            if (e.key === "Enter") {
              handleSendMessage();
            }
          }}
          disabled={isSending}
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
          // --- FIXED: Use the centralized handler ---
          onClick={handleSendMessage}
          className={`bg-blue-600 px-4 py-2 ${isSending ? 'opacity-50 cursor-not-allowed' : ''}`}
          // --- FIXED: Add the disabled attribute ---
          disabled={isSending}
        >
          Send
        </Button>
      </div>
    </div>
  );
};

export default ChatPanel;
