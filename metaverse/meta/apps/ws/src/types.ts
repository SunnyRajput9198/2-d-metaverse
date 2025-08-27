export type OutgoingMessage = any;
// In packages/types/src/index.ts

export type Rect = {
    id: string;
  type: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Circle = {
    id: string;
  type: "circle";
  centerX: number;
  centerY: number;
  radius: number;
};

export type Line = {
    id: string;
  type: "line";
  startX: number;
  startY: number;
  endX: number;
  endY: number;
};

export type Arrow = {
    id: string;
  type: "arrow";
  startX: number;
  startY: number;
  endX: number;
  endY: number;
};

export type Diamond = {
    id: string;
  type: "diamond";
  centerX: number;
  centerY: number;
  width: number;
  height: number;
};

export type Pencil = {
    id: string;
  type: "pencil";
  points: { x: number; y: number }[];
};

export type Text = {
    id: string;
  type: "text";
  x: number;
  y: number;
  text: string;
};

// A union of all possible shape types
export type Shape = Rect | Circle | Line | Arrow | Diamond | Pencil | Text;