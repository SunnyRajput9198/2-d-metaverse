import type { Tool } from "@/components/Canvas";
import { getExistingShapes } from "./http";
type Shape =
  | { type: "rect"; x: number; y: number; width: number; height: number }
  | { type: "circle"; centerX: number; centerY: number; radius: number }
  | { type: "pencil"; points: { x: number; y: number }[] }
  | { type: "arrow"; startX: number; startY: number; endX: number; endY: number }
  | { type: "line"; startX: number; startY: number; endX: number; endY: number }
  | { type: "diamond"; centerX: number; centerY: number; width: number; height: number }
  | { type: "text"; x: number; y: number; text: string };


function drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();


  const headlen = 10;
  const angle = Math.atan2(y2 - y1, x2 - x1);


  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - headlen * Math.cos(angle - Math.PI / 6), y2 - headlen * Math.sin(angle - Math.PI / 6));
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - headlen * Math.cos(angle + Math.PI / 6), y2 - headlen * Math.sin(angle + Math.PI / 6));
  ctx.stroke();
}


function drawDiamond(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, width: number, height: number) {
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
  private roomId: string;
  private clicked = false;
  private startX = 0;
  private startY = 0;
  private selectedTool: Tool = "circle";
  private isAddingText = false;
  private pencilPoints: { x: number; y: number }[] = [];


  socket: WebSocket;


  constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.roomId = roomId;
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
    this.existingShapes = await getExistingShapes(this.roomId);
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


  private clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "rgba(0, 0, 0)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);


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
        this.ctx.arc(shape.centerX, shape.centerY, Math.abs(shape.radius), 0, Math.PI * 2);
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
        drawDiamond(this.ctx, shape.centerX, shape.centerY, shape.width, shape.height);
        break;
      case "text":
       this.ctx.fillText(shape.text, shape.x, shape.y);
        break;
    }
  }


  private createShape(e: MouseEvent): Shape | null {
    const width = e.clientX - this.startX;
    const height = e.clientY - this.startY;


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
          endX: e.clientX,
          endY: e.clientY,
        };
      case "arrow":
        return {
          type: "arrow",
          startX: this.startX,
          startY: this.startY,
          endX: e.clientX,
          endY: e.clientY,
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


  private drawPreview(e: MouseEvent) {
    if (!this.clicked) return;


    const width = e.clientX - this.startX;
    const height = e.clientY - this.startY;


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
        this.ctx.lineTo(e.clientX, e.clientY);
        this.ctx.stroke();
        this.ctx.closePath();
        break;
      case "arrow":
        drawArrow(this.ctx, this.startX, this.startY, e.clientX, e.clientY);
        break;
      case "diamond":
        const cx = this.startX + width / 2;
        const cy = this.startY + height / 2;
        drawDiamond(this.ctx, cx, cy, Math.abs(width), Math.abs(height));
        break;
    }
  }


  private isPointNearShape(x: number, y: number, shape: Shape): boolean {
    const margin = 6;


    switch (shape.type) {
      case "rect":
        return x >= shape.x - margin && x <= shape.x + shape.width + margin &&
               y >= shape.y - margin && y <= shape.y + shape.height + margin;


      case "circle": {
        const dx = x - shape.centerX;
        const dy = y - shape.centerY;
        return Math.sqrt(dx * dx + dy * dy) <= shape.radius + margin;
      }


      case "line":
      case "arrow":
        return this.isPointNearLine(x, y, shape.startX, shape.startY, shape.endX, shape.endY, margin);


      case "diamond":
        return x >= shape.centerX - shape.width / 2 - margin &&
               x <= shape.centerX + shape.width / 2 + margin &&
               y >= shape.centerY - shape.height / 2 - margin &&
               y <= shape.centerY + shape.height / 2 + margin;


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
  if (this.selectedTool === "text") {
    this.isAddingText = true;
    this.startX = e.clientX;
    this.startY = e.clientY;


    // Open prompt or custom input box here to get text from user
    const inputText = prompt("Enter text to add:");
    if (inputText && inputText.trim().length > 0) {
      // Create text shape and add to shapes
      const shape: Shape = {
        type: "text",
        x: this.startX,
        y: this.startY,
        text: inputText.trim(),
      };
      this.existingShapes.push(shape);
      this.socket.send(JSON.stringify({
        type: "chat",
        message: JSON.stringify({ shape }),
        roomId: this.roomId,
      }));
      this.clearCanvas();
      this.isAddingText = false;
    } else {
      this.isAddingText = false;
    }
  } else {
    // maintain previous behavior
    this.clicked = true;
    this.startX = e.clientX;
    this.startY = e.clientY;


    if (this.selectedTool === "pencil") {
      this.pencilPoints = [{ x: e.clientX, y: e.clientY }];
    } else if (this.selectedTool === "eraser") {
      this.eraseAtPoint(e.clientX, e.clientY);
    }
  }
};



  private mouseUpHandler = (e: MouseEvent) => {
    this.clicked = false;


    if (this.selectedTool === "pencil") {
      if (this.pencilPoints.length > 1) {
        this.existingShapes.push({
          type: "pencil",
          points: [...this.pencilPoints],
        });
        this.socket.send(JSON.stringify({
          type: "chat",
          message: JSON.stringify({ shape: this.existingShapes[this.existingShapes.length - 1] }),
          roomId: this.roomId,
        }));
      }
      this.pencilPoints = [];
      this.clearCanvas();
    } else if (this.selectedTool !== "eraser") {
      const shape = this.createShape(e);
      if (!shape) return;
      this.existingShapes.push(shape);
      this.socket.send(JSON.stringify({
        type: "chat",
        message: JSON.stringify({ shape }),
        roomId: this.roomId,
      }));
      this.clearCanvas();
    }
  };


  private mouseMoveHandler = (e: MouseEvent) => {
    if (!this.clicked) return;


    if (this.selectedTool === "pencil") {
      this.pencilPoints.push({ x: e.clientX, y: e.clientY });
      this.clearCanvas();
      this.drawAllShapes();


      this.ctx.strokeStyle = "rgba(255, 255, 255)";
      this.ctx.beginPath();
      this.ctx.moveTo(this.pencilPoints[0].x, this.pencilPoints.y);
      for (let i = 1; i < this.pencilPoints.length; i++) {
        this.ctx.lineTo(this.pencilPoints[i].x, this.pencilPoints[i].y);
      }
      this.ctx.stroke();
    } else if (this.selectedTool === "eraser") {
      this.eraseAtPoint(e.clientX, e.clientY);
    } else {
      this.drawPreview(e);
    }
  };


  private eraseAtPoint(x: number, y: number) {
    for (let i = this.existingShapes.length - 1; i >= 0; i--) {
      if (this.isPointNearShape(x, y, this.existingShapes[i])) {
        this.existingShapes.splice(i, 1);
        this.clearCanvas();
        this.drawAllShapes();


        this.socket.send(JSON.stringify({
          type: "chat",
          message: JSON.stringify({ shapes: this.existingShapes }),
          roomId: this.roomId,
        }));
        break;
      }
    }
  }


  private initMouseHandlers() {
    this.canvas.addEventListener("mousedown", this.mouseDownHandler);
    this.canvas.addEventListener("mouseup", this.mouseUpHandler);
    this.canvas.addEventListener("mousemove", this.mouseMoveHandler);
  }
} 