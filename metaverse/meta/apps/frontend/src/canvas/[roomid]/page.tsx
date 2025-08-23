import React from "react";
import { useParams } from "react-router-dom";
import { RoomCanvas } from "../../components/RoomCanvas";

export default function CanvasPage() {
  const { roomId } = useParams<{ roomId: string }>(); // 👈 get route param

  if (!roomId) return <div>No room ID provided</div>;

  return <RoomCanvas roomId={roomId} />;
}
