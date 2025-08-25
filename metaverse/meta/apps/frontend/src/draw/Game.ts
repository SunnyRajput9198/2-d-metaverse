import type { Tool } from "@/components/Canvas";
import { getExistingShapes } from "./http";
export type Shape =
  | { type: "rect"; x: number; y: number; width: number; height: number }
  | { type: "circle"; centerX: number; centerY: number; radius: number }
  | { type: "pencil"; points: { x: number; y: number }[] }
  | {
      type: "arrow";
      startX: number;
      startY: number;
      endX: number;
      endY: number;
    }
  | { type: "line"; startX: number; startY: number; endX: number; endY: number }
  | {
      type: "diamond";
      centerX: number;
      centerY: number;
      width: number;
      height: number;
    }
  | { type: "text"; x: number; y: number; text: string };

type ResizeHandle =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right"
  | null;
const HANDLE_SIZE = 8;

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  const headlen = 10;
  const angle = Math.atan2(y2 - y1, x2 - x1);

  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - headlen * Math.cos(angle - Math.PI / 6),
    y2 - headlen * Math.sin(angle - Math.PI / 6)
  );
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - headlen * Math.cos(angle + Math.PI / 6),
    y2 - headlen * Math.sin(angle + Math.PI / 6)
  );
  ctx.stroke();
}

function drawDiamond(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  width: number,
  height: number
) {
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - height / 2);
  ctx.lineTo(centerX + width / 2, centerY);
  ctx.lineTo(centerX, centerY + height / 2);
  ctx.lineTo(centerX - width / 2, centerY);
  ctx.closePath();
  ctx.stroke();
}

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private existingShapes: Shape[] = [];
  private clicked = false;
  private startX = 0;
  private startY = 0;
  private selectedTool: Tool = "circle";
  private onShapeCreatedForMove?: (shape: Shape) => void;
  private isAddingText = false;
  private pencilPoints: { x: number; y: number }[] = [];
  private viewport = { x: 0, y: 0, scale: 1 };
  private panning = false;
  private lastPan = { x: 0, y: 0 };
  private selectedShapeIndex: number | null = null;
  private dragOffsetX = 0;
  private dragOffsetY = 0;
  private activeResizeHandle: ResizeHandle = null;

  socket: WebSocket;

  constructor(
    canvas: HTMLCanvasElement,
    socket: WebSocket,
    onShapeCreatedForMove?: (shape: Shape) => void
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.socket = socket;
    this.onShapeCreatedForMove = onShapeCreatedForMove;
    this.init();
    this.initHandlers();
    this.initMouseHandlers();
  }

  destroy() {
    this.canvas.removeEventListener("mousedown", this.mouseDownHandler);
    this.canvas.removeEventListener("mouseup", this.mouseUpHandler);
    this.canvas.removeEventListener("mousemove", this.mouseMoveHandler);
  }

  setTool(tool: Tool) {
    this.selectedTool = tool;
    // Deselect shape when tool changes
    this.selectedShapeIndex = null;
    this.clearCanvas();
  }

  private async init() {
    this.existingShapes = await getExistingShapes();
    this.clearCanvas();
  }

  private initHandlers() {
    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === "chat") {
        const parsedShape = JSON.parse(message.message);
        // A simple way to update shapes; could be more sophisticated
        this.existingShapes = parsedShape.shapes || [parsedShape.shape];
        this.clearCanvas();
      }
    };
  }
  getViewportScale() {
    return this.viewport.scale;
  }
  private notifyMoveIcon(shape: Shape) {
    if (this.onShapeCreatedForMove) {
      this.onShapeCreatedForMove(shape);
    }
  }

  setViewportScale(newScale: number) {
    this.viewport.scale = Math.min(Math.max(newScale, 0.1), 10);
    this.clearCanvas();
  }

  panViewport(dx: number, dy: number) {
    this.viewport.x += dx;
    this.viewport.y += dy;
    this.clearCanvas();
  }

  private getShapeBoundingBox(shape: Shape) {
    let x = 0, y = 0, width = 0, height = 0;
    switch (shape.type) {
      case "rect":
        x = shape.x; y = shape.y; width = shape.width; height = shape.height;
        break;
      case "circle":
        x = shape.centerX - shape.radius; y = shape.centerY - shape.radius;
        width = height = shape.radius * 2;
        break;
      case "diamond":
        x = shape.centerX - shape.width / 2; y = shape.centerY - shape.height / 2;
        width = shape.width; height = shape.height;
        break;
      case "line":
      case "arrow":
        x = Math.min(shape.startX, shape.endX); y = Math.min(shape.startY, shape.endY);
        width = Math.abs(shape.endX - shape.startX); height = Math.abs(shape.endY - shape.startY);
        break;
      case "pencil": {
          const xs = shape.points.map((p) => p.x); const ys = shape.points.map((p) => p.y);
          x = Math.min(...xs); y = Math.min(...ys);
          width = Math.max(...xs) - x; height = Math.max(...ys) - y;
        }
        break;
      case "text":
        x = shape.x - 5; y = shape.y - 20;
        width = shape.text.length * 10; height = 25;
        break;
    }
    return { x, y, width, height };
  }
  private drawSelectionBox(shape: Shape) {
    if (!shape) return;
    const { x, y, width, height } = this.getShapeBoundingBox(shape);

    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = "#56a2e8";
    ctx.lineWidth = 1.5 / this.viewport.scale; // Keep line width constant on screen
    ctx.setLineDash([5 / this.viewport.scale, 3 / this.viewport.scale]);

    ctx.strokeRect(x, y, width, height);

    const handleScreenSize = 8;
    const handleWorldSize = handleScreenSize / this.viewport.scale;
    const corners = [
      { cx: x, cy: y }, // top-left
      { cx: x + width, cy: y }, // top-right
      { cx: x, cy: y + height }, // bottom-left
      { cx: x + width, cy: y + height }, // bottom-right
    ];

    ctx.setLineDash([]);
    ctx.fillStyle = "white";
    ctx.strokeStyle = "black";
    corners.forEach((corner) => {
      ctx.beginPath();
      ctx.rect(
        corner.cx - handleWorldSize / 2,
        corner.cy - handleWorldSize / 2,
        handleWorldSize,
        handleWorldSize
      );
      ctx.fill();
      ctx.stroke();
    });

    ctx.restore();
  }

  private createShapeWorld(x: number, y: number): Shape | null {
    const width = x - this.startX;
    const height = y - this.startY;

    switch (this.selectedTool) {
      case "rect":
        return { type: "rect", x: this.startX, y: this.startY, width, height };
      case "circle":
        const radius = Math.sqrt(width * width + height * height);
        return { type: "circle", radius, centerX: this.startX, centerY: this.startY };
      case "line":
        return { type: "line", startX: this.startX, startY: this.startY, endX: x, endY: y };
      case "arrow":
        return { type: "arrow", startX: this.startX, startY: this.startY, endX: x, endY: y };
      case "diamond":
        return { type: "diamond", centerX: this.startX + width / 2, centerY: this.startY + height / 2, width: Math.abs(width), height: Math.abs(height)};
      default:
        return null;
    }
  }

  private drawPreviewWorld(x: number, y: number) {
    if (!this.clicked) return;
    const width = x - this.startX;
    const height = y - this.startY;

    this.clearCanvas();
    this.ctx.strokeStyle = "rgba(255, 255, 255)";
    switch (this.selectedTool) {
      case "rect":
        this.ctx.strokeRect(this.startX, this.startY, width, height);
        break;
      case "circle":
        const radius = Math.sqrt(width * width + height * height);
        this.ctx.beginPath();
        this.ctx.arc(this.startX, this.startY, radius, 0, Math.PI * 2);
        this.ctx.stroke();
        break;
      case "line":
        this.ctx.beginPath();
        this.ctx.moveTo(this.startX, this.startY);
        this.ctx.lineTo(x, y);
        this.ctx.stroke();
        break;
      case "arrow":
        drawArrow(this.ctx, this.startX, this.startY, x, y);
        break;
      case "diamond":
        const cx = this.startX + width / 2;
        const cy = this.startY + height / 2;
        drawDiamond(this.ctx, cx, cy, Math.abs(width), Math.abs(height));
        break;
    }
  }

  private getHandleUnderPoint(x: number, y: number, shape: Shape): ResizeHandle {
    if (!shape) return null;
    const box = this.getShapeBoundingBox(shape);
    const handleWorldSize = HANDLE_SIZE / this.viewport.scale;

    const handles = {
      "top-left": { x: box.x, y: box.y },
      "top-right": { x: box.x + box.width, y: box.y },
      "bottom-left": { x: box.x, y: box.y + box.height },
      "bottom-right": { x: box.x + box.width, y: box.y + box.height },
    };

    for (const [handle, pos] of Object.entries(handles)) {
      if (
        x >= pos.x - handleWorldSize / 2 && x <= pos.x + handleWorldSize / 2 &&
        y >= pos.y - handleWorldSize / 2 && y <= pos.y + handleWorldSize / 2
      ) {
        return handle as ResizeHandle;
      }
    }
    return null;
  }

  screenToWorld(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const x = (clientX - rect.left - this.viewport.x) / this.viewport.scale;
    const y = (clientY - rect.top - this.viewport.y) / this.viewport.scale;
    return { x, y };
  }

  worldToScreen(x: number, y: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: x * this.viewport.scale + this.viewport.x + rect.left,
      y: y * this.viewport.scale + this.viewport.y + rect.top,
    };
  }

  private clearCanvas() {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "#121212";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.setTransform(
      this.viewport.scale, 0, 0, this.viewport.scale,
      this.viewport.x, this.viewport.y
    );
    this.drawAllShapes();
  }

  private findShapeIndexAtPoint(x: number, y: number): number | null {
    for (let i = this.existingShapes.length - 1; i >= 0; i--) {
      if (this.isPointNearShape(x, y, this.existingShapes[i])) {
        return i;
      }
    }
    return null;
  }

  // --- FULLY IMPLEMENTED RESIZE LOGIC ---
  private resizeFromTopLeft(shape: Shape, dx: number, dy: number) {
    const box = this.getShapeBoundingBox(shape);
    const newWidth = box.width - dx;
    const newHeight = box.height - dy;

    switch (shape.type) {
      case "rect":
        shape.x += dx; shape.y += dy;
        shape.width = newWidth; shape.height = newHeight;
        break;
      case "circle":
        shape.radius = Math.max(newWidth, newHeight) / 2;
        shape.centerX = box.x + dx + newWidth / 2;
        shape.centerY = box.y + dy + newHeight / 2;
        break;
      case "diamond":
        shape.width = newWidth; shape.height = newHeight;
        shape.centerX = box.x + dx + newWidth / 2;
        shape.centerY = box.y + dy + newHeight / 2;
        break;
      case "line":
      case "arrow":
        if (shape.startX < shape.endX) shape.startX += dx; else shape.endX += dx;
        if (shape.startY < shape.endY) shape.startY += dy; else shape.endY += dy;
        break;
      case "pencil":
        this.scalePencilPoints(shape, box.x + dx, box.y + dy, newWidth, newHeight);
        break;
    }
    this.normalizeShapeSize(shape);
  }
  private resizeFromTopRight(shape: Shape, dx: number, dy: number) {
    const box = this.getShapeBoundingBox(shape);
    const newWidth = box.width + dx;
    const newHeight = box.height - dy;
    switch (shape.type) {
      case "rect":
        shape.y += dy; shape.width = newWidth; shape.height = newHeight;
        break;
      case "circle":
        shape.radius = Math.max(newWidth, newHeight) / 2;
        shape.centerX = box.x + newWidth / 2;
        shape.centerY = box.y + dy + newHeight / 2;
        break;
      case "diamond":
        shape.width = newWidth; shape.height = newHeight;
        shape.centerX = box.x + newWidth / 2;
        shape.centerY = box.y + dy + newHeight / 2;
        break;
      case "line":
      case "arrow":
        if (shape.startX > shape.endX) shape.startX += dx; else shape.endX += dx;
        if (shape.startY < shape.endY) shape.startY += dy; else shape.endY += dy;
        break;
      case "pencil":
        this.scalePencilPoints(shape, box.x, box.y + dy, newWidth, newHeight);
        break;
    }
    this.normalizeShapeSize(shape);
  }
  private resizeFromBottomLeft(shape: Shape, dx: number, dy: number) {
    const box = this.getShapeBoundingBox(shape);
    const newWidth = box.width - dx;
    const newHeight = box.height + dy;
    switch (shape.type) {
      case "rect":
        shape.x += dx; shape.width = newWidth; shape.height = newHeight;
        break;
      case "circle":
        shape.radius = Math.max(newWidth, newHeight) / 2;
        shape.centerX = box.x + dx + newWidth / 2;
        shape.centerY = box.y + newHeight / 2;
        break;
      case "diamond":
        shape.width = newWidth; shape.height = newHeight;
        shape.centerX = box.x + dx + newWidth / 2;
        shape.centerY = box.y + newHeight / 2;
        break;
      case "line":
      case "arrow":
        if (shape.startX < shape.endX) shape.startX += dx; else shape.endX += dx;
        if (shape.startY > shape.endY) shape.startY += dy; else shape.endY += dy;
        break;
      case "pencil":
        this.scalePencilPoints(shape, box.x + dx, box.y, newWidth, newHeight);
        break;
    }
    this.normalizeShapeSize(shape);
  }
  private resizeFromBottomRight(shape: Shape, dx: number, dy: number) {
    const box = this.getShapeBoundingBox(shape);
    const newWidth = box.width + dx;
    const newHeight = box.height + dy;
    switch (shape.type) {
      case "rect":
        shape.width = newWidth; shape.height = newHeight;
        break;
      case "circle":
        shape.radius = Math.max(newWidth, newHeight) / 2;
        shape.centerX = box.x + newWidth / 2;
        shape.centerY = box.y + newHeight / 2;
        break;
      case "diamond":
        shape.width = newWidth; shape.height = newHeight;
        shape.centerX = box.x + newWidth / 2;
        shape.centerY = box.y + newHeight / 2;
        break;
      case "line":
      case "arrow":
        if (shape.startX > shape.endX) shape.startX += dx; else shape.endX += dx;
        if (shape.startY > shape.endY) shape.startY += dy; else shape.endY += dy;
        break;
      case "pencil":
        this.scalePencilPoints(shape, box.x, box.y, newWidth, newHeight);
        break;
    }
    this.normalizeShapeSize(shape);
  }

  private scalePencilPoints(shape: Extract<Shape, {type: 'pencil'}>, newX: number, newY: number, newW: number, newH: number) {
    const oldBox = this.getShapeBoundingBox(shape);
    if (oldBox.width === 0 || oldBox.height === 0) return; // Avoid division by zero

    shape.points.forEach(p => {
      p.x = newX + ((p.x - oldBox.x) / oldBox.width) * newW;
      p.y = newY + ((p.y - oldBox.y) / oldBox.height) * newH;
    });
  }
  private normalizeShapeSize(shape: Shape) {
    if ('width' in shape && shape.width < 5) shape.width = 5;
    if ('height' in shape && shape.height < 5) shape.height = 5;
    if (shape.type === "circle" && shape.radius < 3) shape.radius = 3;
  }

  private drawAllShapes() {
    this.existingShapes.forEach((shape, index) => {
      this.drawShape(shape);
      if (index === this.selectedShapeIndex) {
        this.drawSelectionBox(shape);
      }
    });
  }

  private drawShape(shape: Shape) {
    this.ctx.strokeStyle = "rgba(255, 255, 255)";
    this.ctx.fillStyle = "rgba(255, 255, 255)";
    this.ctx.font = "20px sans-serif";
    this.ctx.lineWidth = 1.5;
    switch (shape.type) {
      case "rect":
        this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
        break;
      case "circle":
        this.ctx.beginPath();
        this.ctx.arc(shape.centerX, shape.centerY, shape.radius, 0, Math.PI * 2);
        this.ctx.stroke();
        break;
      case "line":
        this.ctx.beginPath();
        this.ctx.moveTo(shape.startX, shape.startY);
        this.ctx.lineTo(shape.endX, shape.endY);
        this.ctx.stroke();
        break;
      case "arrow":
        drawArrow(this.ctx, shape.startX, shape.startY, shape.endX, shape.endY);
        break;
      case "diamond":
        drawDiamond(this.ctx, shape.centerX, shape.centerY, shape.width, shape.height);
        break;
      case "text":
        this.ctx.fillText(shape.text, shape.x, shape.y);
        break;
      case "pencil":
        this.ctx.beginPath();
        this.ctx.moveTo(shape.points[0].x, shape.points[0].y);
        for (let j = 1; j < shape.points.length; j++) {
          this.ctx.lineTo(shape.points[j].x, shape.points[j].y);
        }
        this.ctx.stroke();
        break;
    }
  }

  private isPointNearShape(x: number, y: number, shape: Shape): boolean {
    const margin = 6 / this.viewport.scale; // Make margin screen-relative
    const box = this.getShapeBoundingBox(shape);
    if (
      x < box.x - margin || x > box.x + box.width + margin ||
      y < box.y - margin || y > box.y + box.height + margin
    ) {
      return false; // Quick check using bounding box
    }

    switch (shape.type) {
      case "rect":
      case "diamond":
        return true; // BBox check is enough
      case "circle":
        const dx = x - shape.centerX;
        const dy = y - shape.centerY;
        return Math.sqrt(dx * dx + dy * dy) <= shape.radius + margin;
      case "line":
      case "arrow":
        return this.isPointNearLine(x, y, shape.startX, shape.startY, shape.endX, shape.endY, margin);
      case "pencil":
        for (let i = 1; i < shape.points.length; i++) {
          if (this.isPointNearLine(x, y, shape.points[i - 1].x, shape.points[i - 1].y, shape.points[i].x, shape.points[i].y, margin)) {
            return true;
          }
        }
        return false;
      default:
        return false;
    }
  }

  private isPointNearLine(px: number, py: number, x1: number, y1: number, x2: number, y2: number, margin: number): boolean {
    const len_sq = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (len_sq === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2) <= margin;
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / len_sq;
    t = Math.max(0, Math.min(1, t));
    const dx = px - (x1 + t * (x2 - x1));
    const dy = py - (y1 + t * (y2 - y1));
    return Math.sqrt(dx * dx + dy * dy) <= margin;
  }

  // --- REFACTORED AND FIXED MOUSE HANDLERS ---
  private mouseDownHandler = (e: MouseEvent) => {
    const { x, y } = this.screenToWorld(e.clientX, e.clientY);
    this.clicked = true;
    this.startX = x;
    this.startY = y;

    // Check for resize handle first if a shape is already selected
    if (this.selectedShapeIndex !== null) {
      const selectedShape = this.existingShapes[this.selectedShapeIndex];
      this.activeResizeHandle = this.getHandleUnderPoint(x, y, selectedShape);
      if (this.activeResizeHandle) {
        this.dragOffsetX = x;
        this.dragOffsetY = y;
        return;
      }
    }

    // Check if clicking a shape to select/move
    const shapeIndex = this.findShapeIndexAtPoint(x, y);
    if (shapeIndex !== null) {
      this.selectedShapeIndex = shapeIndex;
      this.activeResizeHandle = null;
      this.dragOffsetX = x;
      this.dragOffsetY = y;
      this.clearCanvas();
      return;
    }
    
    // If clicking on empty space, deselect and prepare for new shape
    this.selectedShapeIndex = null;
    this.activeResizeHandle = null;

    if (this.selectedTool === "pencil") {
      this.pencilPoints = [{ x, y }];
    } else if (this.selectedTool === "eraser") {
      this.eraseAtPoint(x, y);
    } else if (this.selectedTool === "text") {
      this.createText(x, y);
      this.clicked = false; // Don't drag to create text
    }
    this.clearCanvas();
  };

  private mouseUpHandler = (e: MouseEvent) => {
    if (!this.clicked) return;
    this.clicked = false;
    const { x, y } = this.screenToWorld(e.clientX, e.clientY);

    // If we were resizing or dragging, the action is done. Don't deselect.
    if (this.activeResizeHandle || this.selectedShapeIndex !== null) {
      this.activeResizeHandle = null;
      // Optionally send update to server here
      return;
    }

    // Otherwise, create a new shape
    if (this.selectedTool === "pencil" && this.pencilPoints.length > 1) {
      const newShape: Shape = { type: "pencil", points: [...this.pencilPoints] };
      this.existingShapes.push(newShape);
      this.notifyMoveIcon(newShape);
      this.pencilPoints = [];
    } else if (this.selectedTool !== "pencil" && this.selectedTool !== "eraser" && this.selectedTool !== "text") {
      const shape = this.createShapeWorld(x, y);
      if (!shape) return;
      this.existingShapes.push(shape);
      this.notifyMoveIcon(shape);
    }
    this.clearCanvas();
  };

  private mouseMoveHandler = (e: MouseEvent) => {
    const { x, y } = this.screenToWorld(e.clientX, e.clientY);

    // Update cursor style when not clicking
    if (!this.clicked) {
      const shapeIndex = this.findShapeIndexAtPoint(x, y);
      if (shapeIndex !== null) {
        const handle = this.getHandleUnderPoint(x, y, this.existingShapes[shapeIndex]);
        if (handle) this.canvas.style.cursor = (handle === "top-left" || handle === "bottom-right") ? "nwse-resize" : "nesw-resize";
        else this.canvas.style.cursor = "move";
      } else {
        this.canvas.style.cursor = "default";
      }
      return;
    }

    const dx = x - this.dragOffsetX;
    const dy = y - this.dragOffsetY;

    // Handle resizing
    if (this.activeResizeHandle && this.selectedShapeIndex !== null) {
      const shape = this.existingShapes[this.selectedShapeIndex];
      switch (this.activeResizeHandle) {
        case "top-left": this.resizeFromTopLeft(shape, dx, dy); break;
        case "top-right": this.resizeFromTopRight(shape, dx, dy); break;
        case "bottom-left": this.resizeFromBottomLeft(shape, dx, dy); break;
        case "bottom-right": this.resizeFromBottomRight(shape, dx, dy); break;
      }
      this.dragOffsetX = x;
      this.dragOffsetY = y;
      this.clearCanvas();
      return;
    }

    // Handle moving
    if (this.selectedShapeIndex !== null) {
      this.moveShapeBy(this.existingShapes[this.selectedShapeIndex], dx, dy);
      this.dragOffsetX = x;
      this.dragOffsetY = y;
      this.clearCanvas();
      return;
    }

    // Handle drawing new shapes
    if (this.selectedTool === "pencil") {
      this.pencilPoints.push({ x, y });
      this.clearCanvas();
      // Draw current pencil line preview
      this.ctx.strokeStyle = "rgba(255, 255, 255)";
      this.ctx.beginPath();
      this.ctx.moveTo(this.pencilPoints[0].x, this.pencilPoints[0].y);
      this.pencilPoints.forEach(p => this.ctx.lineTo(p.x, p.y));
      this.ctx.stroke();
    } else if (this.selectedTool === "eraser") {
      this.eraseAtPoint(x, y);
    } else {
      this.drawPreviewWorld(x, y);
    }
  };
  
  private createText(x: number, y: number) {
    const inputText = prompt("Enter text to add:");
    if (inputText && inputText.trim().length > 0) {
        const shape: Shape = { type: "text", x, y, text: inputText.trim() };
        this.existingShapes.push(shape);
        // Send to socket if needed
        this.clearCanvas();
    }
  }

  private moveShapeBy(shape: Shape, dx: number, dy: number) {
    switch (shape.type) {
      case "rect": case "text":
        shape.x += dx; shape.y += dy; break;
      case "circle": case "diamond":
        shape.centerX += dx; shape.centerY += dy; break;
      case "line": case "arrow":
        shape.startX += dx; shape.startY += dy;
        shape.endX += dx; shape.endY += dy;
        break;
      case "pencil":
        shape.points.forEach(p => { p.x += dx; p.y += dy; });
        break;
    }
  }

  private eraseAtPoint(x: number, y: number) {
    const index = this.findShapeIndexAtPoint(x, y);
    if (index !== null) {
      this.existingShapes.splice(index, 1);
      this.clearCanvas();
      // Optionally send update to server
    }
  }

  private initMouseHandlers() {
    this.canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      const zoomFactor = 1.1;
      const mouseWorld = this.screenToWorld(e.clientX, e.clientY);
      const scale = e.deltaY < 0 ? this.viewport.scale * zoomFactor : this.viewport.scale / zoomFactor;
      this.viewport.scale = Math.min(Math.max(scale, 0.1), 10);
      const newMouseWorld = this.screenToWorld(e.clientX, e.clientY);
      this.viewport.x += (newMouseWorld.x - mouseWorld.x) * this.viewport.scale;
      this.viewport.y += (newMouseWorld.y - mouseWorld.y) * this.viewport.scale;
      this.clearCanvas();
    });
    this.canvas.addEventListener("mousedown", this.mouseDownHandler);
    this.canvas.addEventListener("mouseup", this.mouseUpHandler);
    this.canvas.addEventListener("mousemove", this.mouseMoveHandler);
  }
}