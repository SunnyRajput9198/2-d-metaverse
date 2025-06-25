// components/FloatingEmoji.tsx
import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type FloatingEmojiProps = {
  emoji: string;
  x: number; // in pixels (absolute position)
  y: number; // in pixels (absolute position)
  id: string; // unique key per emoji instance
  onComplete: (id: string) => void;
};

const FloatingEmoji: React.FC<FloatingEmojiProps> = ({ emoji, x, y, id, onComplete }) => {
  useEffect(() => {
    const timeout = setTimeout(() => {
      onComplete(id);
    }, 1000); // match the animation duration

    return () => clearTimeout(timeout);
  }, [id, onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        key={id}
        initial={{ y: 0, opacity: 1 }}
        animate={{ y: -50, opacity: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        style={{
          position: "absolute",
          left: x,
          top: y,
          pointerEvents: "none",
          fontSize: "24px",
          zIndex: 9999,
        }}
      >
        {emoji}
      </motion.div>
    </AnimatePresence>
  );
};

export default FloatingEmoji;
