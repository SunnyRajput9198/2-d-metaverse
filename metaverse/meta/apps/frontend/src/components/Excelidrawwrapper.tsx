import React, { useMemo, useEffect, useState, useRef, useCallback } from 'react';
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import type { ExcalidrawElement } from '../types/Excelidraw';
import { throttle } from 'lodash';

type ExcalidrawAPI = {
  updateScene: (scene: { elements: readonly ExcalidrawElement[] }) => void;
  getSceneElements: () => readonly ExcalidrawElement[];
  getAppState: () => { 
    isDragging?: boolean; 
    isEditing?: boolean; 
    isResizing?: boolean;
    isLoading?: boolean;
    viewModeEnabled?: boolean;
  };
};

interface ExcalidrawWrapperProps {
  onClose: () => void;
  excalidrawElements: readonly ExcalidrawElement[];
  sendCanvasUpdate: (elements: readonly ExcalidrawElement[]) => void;
}

const ExcalidrawWrapper: React.FC<ExcalidrawWrapperProps> = ({ 
  onClose, 
  excalidrawElements, 
  sendCanvasUpdate 
}) => {
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawAPI | null>(null);
  const isUpdatingFromRemote = useRef(false);
  const lastRemoteElements = useRef<readonly ExcalidrawElement[]>([]);
  const initializationComplete = useRef(false);

  // Helper function to compare elements more efficiently
  const elementsAreEqual = useCallback((
    elements1: readonly ExcalidrawElement[], 
    elements2: readonly ExcalidrawElement[]
  ): boolean => {
    if (!elements1 || !elements2) return false;
    if (elements1.length !== elements2.length) return false;
    
    // Compare by IDs and versions if available
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

  // Handle Excalidraw API initialization
  const handleExcalidrawAPI = useCallback((api: ExcalidrawAPI) => {
    console.log('Excalidraw API initialized');
    setExcalidrawAPI(api);
    initializationComplete.current = true;
  }, []);

  // Update scene when remote elements change
  useEffect(() => {
    if (!excalidrawAPI || !excalidrawElements || !initializationComplete.current) {
      return;
    }

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
        
        console.log('Updating scene from remote elements:', excalidrawElements.length);
        isUpdatingFromRemote.current = true;
        lastRemoteElements.current = excalidrawElements;
        
        excalidrawAPI.updateScene({ elements: excalidrawElements });
        
        // Reset flag after update completes
        setTimeout(() => {
          isUpdatingFromRemote.current = false;
        }, 100);
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
        if (isUpdatingFromRemote.current || !initializationComplete.current) {
          console.log('Skipping update - updating from remote or not initialized');
          return;
        }
        
        // Only send if elements actually changed
        if (!elementsAreEqual(lastRemoteElements.current, elements)) {
          console.log('Sending canvas update:', elements.length);
          sendCanvasUpdate(elements);
        }
      }, 300), // Increased throttle time
    [sendCanvasUpdate, elementsAreEqual]
  );

  // Handle changes from local user
  const handleChange = useCallback((elements: readonly ExcalidrawElement[]) => {
    if (!isUpdatingFromRemote.current && initializationComplete.current) {
      throttledSendUpdate(elements);
    }
  }, [throttledSendUpdate]);

  // Show loading if elements are not ready
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

  return (
    <div style={{ 
      position: "fixed", 
      top: 0, 
      left: 0, 
      width: "100%", 
      height: "100%", 
      zIndex: 1000,
      backgroundColor: "#1e1e1e"
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