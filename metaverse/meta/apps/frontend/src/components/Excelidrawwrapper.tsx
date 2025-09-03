import React, { useMemo, useEffect, useState, useRef, useCallback } from 'react';
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import useWebSocket from '@/hooks/useWebsocket';
import type { ExcalidrawElement } from '../types/Excelidraw';
import { throttle } from 'lodash';

type ExcalidrawAPI = {
  updateScene: (scene: { elements: readonly ExcalidrawElement[] }) => void;
  getSceneElements: () => readonly ExcalidrawElement[];
  getAppState: () => { 
    isDragging: boolean; 
    isEditing: boolean; 
    isResizing: boolean;
    // Add other potential app state properties
    isLoading?: boolean;
    viewModeEnabled?: boolean;
  };
};

interface ExcalidrawWrapperProps {
  onClose: () => void;
  spaceId: string;
}

const ExcalidrawWrapper: React.FC<ExcalidrawWrapperProps> = ({ onClose, spaceId }) => {
  const { excalidrawElements, sendCanvasUpdate } = useWebSocket(spaceId);
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawAPI | null>(null);
  const isUpdatingFromRemote = useRef(false);
  const lastRemoteElements = useRef<readonly ExcalidrawElement[]>([]);

  // ADD THE LOADING CHECK HERE - RIGHT AT THE START OF RETURN
  if (!excalidrawElements) {
    return (
      <div style={{ 
        position: "fixed", 
        top: 0, 
        left: 0, 
        width: "100%", 
        height: "100%", 
        zIndex: 1000,
        backgroundColor: "#1e1e1e",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white"
      }}>
        <div>Loading canvas...</div>
      </div>
    );
  }

  // Helper function to compare elements more efficiently
  const elementsAreEqual = useCallback((
    elements1: readonly ExcalidrawElement[], 
    elements2: readonly ExcalidrawElement[]
  ): boolean => {
    if (elements1.length !== elements2.length) return false;
    
    // Compare by IDs and versions if available, or use deep comparison as fallback
    for (let i = 0; i < elements1.length; i++) {
      const el1 = elements1[i];
      const el2 = elements2[i];
      
      if (el1.id !== el2.id || 
          el1.versionNonce !== el2.versionNonce || 
          el1.updated !== el2.updated) {
        return false;
      }
    }
    return true;
  }, []);

  // Update scene when remote elements change
  useEffect(() => {
    if (!excalidrawAPI || !excalidrawElements) return;

    try {
      const appState = excalidrawAPI.getAppState();
      const isInteracting = appState?.isDragging || 
                           appState?.isEditing || 
                           appState?.isResizing ||
                           appState?.isLoading;

      // Only update if user is not interacting and elements actually changed
      if (!isInteracting && 
          !isUpdatingFromRemote.current && 
          !elementsAreEqual(lastRemoteElements.current, excalidrawElements)) {
        
        isUpdatingFromRemote.current = true;
        lastRemoteElements.current = excalidrawElements;
        
        excalidrawAPI.updateScene({ elements: excalidrawElements });
        
        // Reset flag after a short delay to allow the update to complete
        setTimeout(() => {
          isUpdatingFromRemote.current = false;
        }, 50);
      }
    } catch (error) {
      console.error('Error updating Excalidraw scene:', error);
      isUpdatingFromRemote.current = false;
    }
  }, [excalidrawAPI, excalidrawElements, elementsAreEqual]);

  // Throttled function to send updates to other users
  const throttledSendUpdate = useMemo(
    () =>
      throttle((elements: readonly ExcalidrawElement[]) => {
        // Don't send updates if we're currently updating from remote
        if (isUpdatingFromRemote.current) return;
        
        // Only send if elements actually changed
        if (!elementsAreEqual(lastRemoteElements.current, elements)) {
          sendCanvasUpdate(elements);
        }
      }, 200), // Increased throttle time to reduce conflicts
    [sendCanvasUpdate, elementsAreEqual]
  );

  // Handle Excalidraw API initialization
  const handleExcalidrawAPI = useCallback((api: ExcalidrawAPI) => {
    setExcalidrawAPI(api);
  }, []);

  // Handle changes from local user
  const handleChange = useCallback((elements: readonly ExcalidrawElement[]) => {
    if (!isUpdatingFromRemote.current) {
      throttledSendUpdate(elements);
    }
  }, [throttledSendUpdate]);

  return (
    <div style={{ 
      position: "fixed", 
      top: 0, 
      left: 0, 
      width: "100%", 
      height: "100%", 
      zIndex: 1000,
      backgroundColor: "#1e1e1e" // Prevent white flash
    }}>
      <button 
        onClick={onClose} 
        style={{ 
          position: "absolute", 
          top: 10, 
          right: 10, 
          zIndex: 1001,
          padding: "8px 16px",
          backgroundColor: "#333",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer"
        }}
      >
        Close Canvas
      </button>
      <Excalidraw
      // @ts-ignore
        excalidrawAPI={handleExcalidrawAPI}
        initialData={{ 
          elements: excalidrawElements || [],
          appState: { theme: "dark" }
        }}
        onChange={handleChange}
        theme="dark"
      />
    </div>
  );
};

export default ExcalidrawWrapper;