import React from 'react';
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";

// This interface defines the props our component accepts.
// By adding it, we tell TypeScript that passing an `onClose` function is allowed and expected.
interface ExcalidrawWrapperProps {
  onClose: () => void;
}

const ExcalidrawWrapper: React.FC<ExcalidrawWrapperProps> = ({ onClose }) => {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 1000,
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          zIndex: 1001,
          padding: "8px 12px",
          backgroundColor: "white",
          border: "1px solid #ccc",
          borderRadius: "8px",
          cursor: "pointer",
          boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
        }}
      >
        Close Canvas
      </button>
      <Excalidraw />
    </div>
  );
};

export default ExcalidrawWrapper;
