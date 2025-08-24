import type { Tool } from "@/components/Canvas";
import { getExistingShapes } from "./http";
type Shape =
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
  private isAddingText = false;
  private pencilPoints: { x: number; y: number }[] = [];
  private viewport = { x: 0, y: 0, scale: 1 }; // x and y are pan offsets, scale is zoom
  private panning = false;
  private lastPan = { x: 0, y: 0 };

  socket: WebSocket;

  constructor(canvas: HTMLCanvasElement, socket: WebSocket) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.socket = socket;
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
        this.existingShapes.push(parsedShape.shape);
        this.clearCanvas();
      }
    };
  }
  getViewportScale() {
  return this.viewport.scale;
}

setViewportScale(newScale: number) {
  this.viewport.scale = Math.min(Math.max(newScale, 0.1), 10); // clamp zooming
  this.clearCanvas();
}

panViewport(dx: number, dy: number) {
  this.viewport.x += dx;
  this.viewport.y += dy;
  this.clearCanvas();
}

  private createShapeWorld(x: number, y: number): Shape | null {
  const width = x - this.startX;
  const height = y - this.startY;

  switch (this.selectedTool) {
    case "rect":
      return {
        type: "rect",
        x: this.startX,
        y: this.startY,
        width,
        height,
      };
    case "circle":
      const radius = Math.max(width, height) / 2;
      return {
        type: "circle",
        radius,
        centerX: this.startX + radius,
        centerY: this.startY + radius,
      };
    case "line":
      return {
        type: "line",
        startX: this.startX,
        startY: this.startY,
        endX: x,
        endY: y,
      };
    case "arrow":
      return {
        type: "arrow",
        startX: this.startX,
        startY: this.startY,
        endX: x,
        endY: y,
      };
    case "diamond":
      return {
        type: "diamond",
        centerX: this.startX + width / 2,
        centerY: this.startY + height / 2,
        width: Math.abs(width),
        height: Math.abs(height),
      };
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
      const radius = Math.max(width, height) / 2;
      const centerX = this.startX + radius;
      const centerY = this.startY + radius;
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, Math.abs(radius), 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.closePath();
      break;
    case "line":
      this.ctx.beginPath();
      this.ctx.moveTo(this.startX, this.startY);
      this.ctx.lineTo(x, y);
      this.ctx.stroke();
      this.ctx.closePath();
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

  // Convert screen to world
  screenToWorld(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const x = (clientX - rect.left - this.viewport.x) / this.viewport.scale;
    const y = (clientY - rect.top - this.viewport.y) / this.viewport.scale;
    return { x, y };
  }

  // Convert world to screen (useful for drawing UI/selection if needed)
  worldToScreen(x: number, y: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: x * this.viewport.scale + this.viewport.x + rect.left,
      y: y * this.viewport.scale + this.viewport.y + rect.top,
    };
  }

private clearCanvas() {
  // Reset to identity matrix (no transform)
  this.ctx.setTransform(1, 0, 0, 1, 0, 0);
  
  // Clear entire canvas in pixel coordinates
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  
  // Fill background (black or any color)
  this.ctx.fillStyle = "black";
  this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  
  // Now apply transform for drawing world
  this.ctx.setTransform(
    this.viewport.scale, 0,
    0, this.viewport.scale,
    this.viewport.x, this.viewport.y
  );
  
  // Draw existing shapes
  this.drawAllShapes();
}

  private drawAllShapes() {
    for (const shape of this.existingShapes) {
      if (shape.type === "pencil") {
        this.ctx.strokeStyle = "rgba(255, 255, 255)";
        this.ctx.beginPath();
        const points = shape.points;
        this.ctx.moveTo(points[0].x, points.y);
        for (let i = 1; i < points.length; i++) {
          this.ctx.lineTo(points[i].x, points[i].y);
        }
        this.ctx.stroke();
      } else {
        this.drawShape(shape);
      }
    }
  }

  private drawShape(shape: Shape) {
    this.ctx.strokeStyle = "rgba(255, 255, 255)";
    this.ctx.fillStyle = "rgba(255, 255, 255)";
    this.ctx.font = "20px sans-serif"; // Customize size & font as needed
    switch (shape.type) {
      case "rect":
        this.ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
        break;
      case "circle":
        this.ctx.beginPath();
        this.ctx.arc(
          shape.centerX,
          shape.centerY,
          Math.abs(shape.radius),
          0,
          Math.PI * 2
        );
        this.ctx.stroke();
        this.ctx.closePath();
        break;
      case "line":
        this.ctx.beginPath();
        this.ctx.moveTo(shape.startX, shape.startY);
        this.ctx.lineTo(shape.endX, shape.endY);
        this.ctx.stroke();
        this.ctx.closePath();
        break;
      case "arrow":
        drawArrow(this.ctx, shape.startX, shape.startY, shape.endX, shape.endY);
        break;
      case "diamond":
        drawDiamond(
          this.ctx,
          shape.centerX,
          shape.centerY,
          shape.width,
          shape.height
        );
        break;
      case "text":
        this.ctx.fillText(shape.text, shape.x, shape.y);
        break;
    }
  }
// old fixed canvad shape drawing logic
//   private createShape(e: MouseEvent): Shape | null {
//     const width = e.clientX - this.startX;
//     const height = e.clientY - this.startY;

//     switch (this.selectedTool) {
//       case "rect":
//         return {
//           type: "rect",
//           x: this.startX,
//           y: this.startY,
//           width,
//           height,
//         };
//       case "circle":
//         const radius = Math.max(width, height) / 2;
//         return {
//           type: "circle",
//           radius,
//           centerX: this.startX + radius,
//           centerY: this.startY + radius,
//         };
//       case "line":
//         return {
//           type: "line",
//           startX: this.startX,
//           startY: this.startY,
//           endX: e.clientX,
//           endY: e.clientY,
//         };
//       case "arrow":
//         return {
//           type: "arrow",
//           startX: this.startX,
//           startY: this.startY,
//           endX: e.clientX,
//           endY: e.clientY,
//         };
//       case "diamond":
//         return {
//           type: "diamond",
//           centerX: this.startX + width / 2,
//           centerY: this.startY + height / 2,
//           width: Math.abs(width),
//           height: Math.abs(height),
//         };
//       default:
//         return null;
//     }
//   }
// old fixed canvas preview logic
//   private drawPreview(e: MouseEvent) {
//     if (!this.clicked) return;

//     const width = e.clientX - this.startX;
//     const height = e.clientY - this.startY;

//     this.clearCanvas();
//     this.ctx.strokeStyle = "rgba(255, 255, 255)";

//     switch (this.selectedTool) {
//       case "rect":
//         this.ctx.strokeRect(this.startX, this.startY, width, height);
//         break;
//       case "circle":
//         const radius = Math.max(width, height) / 2;
//         const centerX = this.startX + radius;
//         const centerY = this.startY + radius;
//         this.ctx.beginPath();
//         this.ctx.arc(centerX, centerY, Math.abs(radius), 0, Math.PI * 2);
//         this.ctx.stroke();
//         this.ctx.closePath();
//         break;
//       case "line":
//         this.ctx.beginPath();
//         this.ctx.moveTo(this.startX, this.startY);
//         this.ctx.lineTo(e.clientX, e.clientY);
//         this.ctx.stroke();
//         this.ctx.closePath();
//         break;
//       case "arrow":
//         drawArrow(this.ctx, this.startX, this.startY, e.clientX, e.clientY);
//         break;
//       case "diamond":
//         const cx = this.startX + width / 2;
//         const cy = this.startY + height / 2;
//         drawDiamond(this.ctx, cx, cy, Math.abs(width), Math.abs(height));
//         break;
//     }
//   }

  private isPointNearShape(x: number, y: number, shape: Shape): boolean {
    const margin = 6;

    switch (shape.type) {
      case "rect":
        return (
          x >= shape.x - margin &&
          x <= shape.x + shape.width + margin &&
          y >= shape.y - margin &&
          y <= shape.y + shape.height + margin
        );

      case "circle": {
        const dx = x - shape.centerX;
        const dy = y - shape.centerY;
        return Math.sqrt(dx * dx + dy * dy) <= shape.radius + margin;
      }

      case "line":
      case "arrow":
        return this.isPointNearLine(
          x,
          y,
          shape.startX,
          shape.startY,
          shape.endX,
          shape.endY,
          margin
        );

      case "diamond":
        return (
          x >= shape.centerX - shape.width / 2 - margin &&
          x <= shape.centerX + shape.width / 2 + margin &&
          y >= shape.centerY - shape.height / 2 - margin &&
          y <= shape.centerY + shape.height / 2 + margin
        );

      case "pencil":
        for (let i = 1; i < shape.points.length; i++) {
          if (
            this.isPointNearLine(
              x,
              y,
              shape.points[i - 1].x,
              shape.points[i - 1].y,
              shape.points[i].x,
              shape.points[i].y,
              margin
            )
          ) {
            return true;
          }
        }
        return false;

      default:
        return false;
    }
  }

  private isPointNearLine(
    px: number,
    py: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    margin: number
  ): boolean {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    let param = -1;
    if (len_sq !== 0) param = dot / len_sq;

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy) <= margin;
  }

  private mouseDownHandler = (e: MouseEvent) => {
  const { x, y } = this.screenToWorld(e.clientX, e.clientY);
  if (this.selectedTool === "text") {
    this.isAddingText = true;
    this.startX = x;
    this.startY = y;

    const inputText = prompt("Enter text to add:");
    if (inputText && inputText.trim().length > 0) {
      const shape: Shape = {
        type: "text",
        x: this.startX,
        y: this.startY,
        text: inputText.trim(),
      };
      this.existingShapes.push(shape);
      this.socket.send(
        JSON.stringify({
          type: "chat",
          message: JSON.stringify({ shape }),
        })
      );
      this.clearCanvas();
      this.isAddingText = false;
    } else {
      this.isAddingText = false;
    }
  } else {
    this.clicked = true;
    this.startX = x;
    this.startY = y;

    if (this.selectedTool === "pencil") {
      this.pencilPoints = [{ x, y }];
    } else if (this.selectedTool === "eraser") {
      this.eraseAtPoint(x, y); // Use world coordinates!
    }
  }
};


 private mouseUpHandler = (e: MouseEvent) => {
  this.clicked = false;

  const { x, y } = this.screenToWorld(e.clientX, e.clientY);

  if (this.selectedTool === "pencil") {
    if (this.pencilPoints.length > 1) {
      this.existingShapes.push({
        type: "pencil",
        points: [...this.pencilPoints],
      });
      this.socket.send(
        JSON.stringify({
          type: "chat",
          message: JSON.stringify({
            shape: this.existingShapes[this.existingShapes.length - 1],
          }),
        })
      );
    }
    this.pencilPoints = [];
    this.clearCanvas();
  } else if (this.selectedTool !== "eraser") {
    const shape = this.createShapeWorld(x, y); // new helper, see below
    if (!shape) return;
    this.existingShapes.push(shape);
    this.socket.send(
      JSON.stringify({
        type: "chat",
        message: JSON.stringify({ shape }),
      })
    );
    this.clearCanvas();
  }
};


 private mouseMoveHandler = (e: MouseEvent) => {
  const { x, y } = this.screenToWorld(e.clientX, e.clientY);
  if (!this.clicked) return;

  if (this.selectedTool === "pencil") {
    this.pencilPoints.push({ x, y }); // use world
    this.clearCanvas();

    this.ctx.strokeStyle = "rgba(255, 255, 255)";
    this.ctx.beginPath();
    this.ctx.moveTo(this.pencilPoints[0].x, this.pencilPoints.y);
    for (let i = 1; i < this.pencilPoints.length; i++) {
      this.ctx.lineTo(this.pencilPoints[i].x, this.pencilPoints[i].y);
    }
    this.ctx.stroke();
  } else if (this.selectedTool === "eraser") {
    this.eraseAtPoint(x, y); // Use world
  } else {
    this.drawPreviewWorld(x, y); // see below
  }
};


  private eraseAtPoint(x: number, y: number) {
    for (let i = this.existingShapes.length - 1; i >= 0; i--) {
      if (this.isPointNearShape(x, y, this.existingShapes[i])) {
        this.existingShapes.splice(i, 1);
        this.clearCanvas();

        this.socket.send(
          JSON.stringify({
            type: "chat",
            message: JSON.stringify({ shapes: this.existingShapes }),
          })
        );
        break;
      }
    }
  }

  private initMouseHandlers() {
    this.canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      const zoomFactor = 1.1;
      const mouseWorld = this.screenToWorld(e.clientX, e.clientY);
      if (e.deltaY < 0) {
        this.viewport.scale *= zoomFactor;
      } else {
        this.viewport.scale /= zoomFactor;
      }
      // Pan so the zoom is centered under the mouse
      const afterWorld = this.screenToWorld(e.clientX, e.clientY);
      this.viewport.x += (afterWorld.x - mouseWorld.x) * this.viewport.scale;
      this.viewport.y += (afterWorld.y - mouseWorld.y) * this.viewport.scale;
      this.clearCanvas();
    });

    this.canvas.addEventListener("mousedown", this.mouseDownHandler);
    this.canvas.addEventListener("mouseup", this.mouseUpHandler);
    this.canvas.addEventListener("mousemove", this.mouseMoveHandler);
  }
}
