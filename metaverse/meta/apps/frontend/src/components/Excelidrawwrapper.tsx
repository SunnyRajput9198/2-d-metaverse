import React from 'react';
import { useMemo } from 'react';
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import useWebSocket from '@/hooks/useWebsocket'; // Adjust path if needed
import type { ExcalidrawElement} from "../types/Excelidraw";
import { throttle } from 'lodash'; // Recommended: npm install lodash @types/lodash


// This interface defines the props our component accepts.
// By adding it, we tell TypeScript that passing an `onClose` function is allowed and expected.
interface ExcalidrawWrapperProps {
  onClose: () => void;
  spaceId: string;
}

const ExcalidrawWrapper: React.FC<ExcalidrawWrapperProps> = ({ onClose, spaceId }) => {
  // Get the real-time elements and the update function from our hook
  const { excalidrawElements, sendCanvasUpdate } = useWebSocket(spaceId);

  // Throttle the sending of updates to prevent flooding the server
  const throttledSendUpdate = useMemo(
    () => throttle((elements: readonly ExcalidrawElement[]) => {
        sendCanvasUpdate(elements);
    }, 100), // Send updates at most every 100ms
    [sendCanvasUpdate]
  );

  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 1000 }}>
      <button
        onClick={onClose}
        style={{ position: "absolute", top: "10px", right: "10px", zIndex: 1001, /* ... other styles */ }}
      >
        Close Canvas
      </button>
      
      {/* The key ensures Excalidraw re-initializes when data first arrives */}
      <Excalidraw
        key={excalidrawElements.length > 0 ? excalidrawElements[0].seed : 'empty'}
        initialData={{
          elements: excalidrawElements,
        }}
        onChange={throttledSendUpdate} // Call the throttled function on any change
        theme="dark"
      />
    </div>
  );
};

export default ExcalidrawWrapper;
