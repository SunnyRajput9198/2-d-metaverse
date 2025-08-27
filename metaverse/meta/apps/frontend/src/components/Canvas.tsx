import { useEffect, useRef, useState } from "react";
import { Game } from "../draw/Game";
import type { Shape } from "../types";
import useWebSocket from "@/hooks/useWebsocket";
import {
  Circle,
  Pencil,
  RectangleHorizontalIcon,
  ArrowUpRight,
  LineChart,
  Gem,
  Eraser,
  Type,
  ZoomIn,
  ZoomOut,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

export type Tool = "circle" | "rect" | "pencil" | "arrow" | "line" | "diamond" | "eraser" | "text";

import React from "react";

type IconButtonProps = {
  onClick: () => void;
  activated?: boolean;
  icon: React.ReactNode;
};

export function IconButton({ onClick, activated = false, icon }: IconButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        background: activated ? "#e0e0e0" : "transparent",
        border: "none",
        cursor: "pointer",
        padding: 8,
        marginRight: 4,
        borderRadius: 4,
      }}
      aria-pressed={activated}
      type="button"
    >
      {icon}
    </button>
  );
}

type TopbarProps = {
  selectedTool: Tool;
  setSelectedTool: (s: Tool) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onPanLeft: () => void;
  onPanRight: () => void;
  onPanUp: () => void;
  onPanDown: () => void;
  shapeForMoveIcon: Shape | null;
};

function Topbar({
  selectedTool,
  setSelectedTool,
  onZoomIn,
  onZoomOut,
  onPanLeft,
  onPanRight,
  onPanUp,
  onPanDown,
  shapeForMoveIcon,
}: TopbarProps): React.ReactElement {
  const moveButtonRef = useRef<HTMLButtonElement>(null);

  // When a new shapeForMoveIcon arrives, focus the Move button
  useEffect(() => {
    if (shapeForMoveIcon && moveButtonRef.current) {
      moveButtonRef.current.focus();
    }
  }, [shapeForMoveIcon]);
  return (
    <div
      style={{
        position: "fixed",
        top: 10,
        left: 10,
        zIndex: 1000,
      }}
    >
      <div className="flex gap-2 items-center">
        {/* Existing tool icons */}
        <IconButton onClick={() => setSelectedTool("pencil")} activated={selectedTool === "pencil"} icon={<Pencil />} />
        <IconButton onClick={() => setSelectedTool("rect")} activated={selectedTool === "rect"} icon={<RectangleHorizontalIcon />} />
        <IconButton onClick={() => setSelectedTool("circle")} activated={selectedTool === "circle"} icon={<Circle />} />
        <IconButton onClick={() => setSelectedTool("arrow")} activated={selectedTool === "arrow"} icon={<ArrowUpRight />} />
        <IconButton onClick={() => setSelectedTool("line")} activated={selectedTool === "line"} icon={<LineChart />} />
        <IconButton onClick={() => setSelectedTool("diamond")} activated={selectedTool === "diamond"} icon={<Gem />} />
        <IconButton onClick={() => setSelectedTool("eraser")} activated={selectedTool === "eraser"} icon={<Eraser />} />
        <IconButton onClick={() => setSelectedTool("text")} activated={selectedTool === "text"} icon={<Type />} />

        {/* Zoom controls */}
        <IconButton onClick={onZoomIn} icon={<ZoomIn />} />
        <IconButton onClick={onZoomOut} icon={<ZoomOut />} />

        {/* Pan controls */}
        <IconButton onClick={onPanUp} icon={<ArrowUp />} />
        <IconButton onClick={onPanDown} icon={<ArrowDown />} />
        <IconButton onClick={onPanLeft} icon={<ArrowLeft />} />
        <IconButton onClick={onPanRight} icon={<ArrowRight />} />
      </div>
    </div>
  );
}

export function Canvas({ spaceId }: { spaceId: string }): React.ReactElement {
  const { ws: socket, shapes } = useWebSocket(spaceId)
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [game, setGame] = useState<Game>();
  const [selectedTool, setSelectedTool] = useState<Tool>("circle");
  // State to hold the last created shape for move icon
  const [shapeForMoveIcon, setShapeForMoveIcon] = useState<Shape | null>(null);
  useEffect(() => {
    if (!socket) return; // wait for socket

    if (canvasRef.current && containerRef.current) {
      const g = new Game(canvasRef.current, containerRef.current, socket, (shape) => {
        setShapeForMoveIcon(shape);
      });
      setGame(g);
      g.start();

      return () => g.destroy();
    }
  }, [socket]);

  useEffect(() => {
    if (game && shapes) {
      game.setShapes(shapes);
    }
  }, [game, shapes]);

  useEffect(() => {
    // Check if both refs are ready
    if (canvasRef.current && containerRef.current) {
      if(!socket) return;
      // 2. Pass the container ref to the Game constructor in the correct order
      // The constructor expects: canvas, container, socket, callback
      const g = new Game(
        canvasRef.current,
        containerRef.current, // Pass the container here
        socket,
        (shape: Shape) => {
          setShapeForMoveIcon(shape);
        }
      );
      setGame(g);
      g.start();
      return () => {
        g.destroy();
      };
    }
  }, []);


  const PAN_STEP = 50;
  const ZOOM_FACTOR = 1.2;

  const onZoomIn = () => {
    if (!game) return;
    game.setViewportScale(game.getViewportScale() * ZOOM_FACTOR);
  };

  const onZoomOut = () => {
    if (!game) return;
    game.setViewportScale(game.getViewportScale() / ZOOM_FACTOR);
  };

  const onPanLeft = () => {
    if (!game) return;
    game.panViewport(PAN_STEP, 0);
  };

  const onPanRight = () => {
    if (!game) return;
    game.panViewport(-PAN_STEP, 0);
  };

  const onPanUp = () => {
    if (!game) return;
    game.panViewport(0, PAN_STEP);
  };

  const onPanDown = () => {
    if (!game) return;
    game.panViewport(0, -PAN_STEP);
  };

  return (
    <div ref={containerRef} style={{ position: "relative", height: "100vh", overflow: "hidden" }}>

      <canvas ref={canvasRef} width={window.innerWidth} height={window.innerHeight} style={{ display: "block" }} />
      <Topbar
        selectedTool={selectedTool}
        setSelectedTool={(tool) => {
          console.log("TOOL SELECTED:", tool); // <-- ADD THIS LINE
          setSelectedTool(tool);
        }}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onPanLeft={onPanLeft}
        onPanRight={onPanRight}
        onPanUp={onPanUp}
        onPanDown={onPanDown}
        shapeForMoveIcon={shapeForMoveIcon}
      />
    </div>
  );
}
