import { initDraw } from "../draw/index";
import { useEffect, useRef, useState } from "react";
import { Game } from "../draw/Game";
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

export function Canvas({ socket }: { socket: WebSocket }):React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [game, setGame] = useState<Game>();
  const [selectedTool, setSelectedTool] = useState<Tool>("circle");

  useEffect(() => {
    game?.setTool(selectedTool);
  }, [selectedTool, game]);

  useEffect(() => {
    if (canvasRef.current) {
      const g = new Game(canvasRef.current, socket);
      setGame(g);
      return () => {
        g.destroy();
      };
    }
    // Adding 'socket' ensures Game instance recreates if socket changes
  }, [socket]);

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
    <div style={{ height: "100vh", overflow: "hidden" }}>
      <canvas ref={canvasRef} width={window.innerWidth} height={window.innerHeight} style={{ display: "block" }} />
      <Topbar
        selectedTool={selectedTool}
        setSelectedTool={setSelectedTool}
        onZoomIn={onZoomIn}
        onZoomOut={onZoomOut}
        onPanLeft={onPanLeft}
        onPanRight={onPanRight}
        onPanUp={onPanUp}
        onPanDown={onPanDown}
      />
    </div>
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
}: TopbarProps): React.ReactElement {
  return (
    <div
      style={{
        position: "fixed",
        top: 10,
        left: 10,
      }}
    >
      <div className="flex gap-2">
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
