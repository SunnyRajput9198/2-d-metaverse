import { WebSocketServer } from 'ws';
import WebSocket from 'ws';
import { User } from './User';
import client from "@repo/db";
const PORT = Number(process.env.PORT || 3001);
if (!process.env.JWT_PASSWORD) throw new Error("JWT_PASSWORD must be set before starting the WebSocket server");
// Excalidraw updates send the full scene, which can exceed the default 100 KiB
// WebSocket limit as rooms grow. Keep a bounded 5 MiB frame size instead.
const wss = new WebSocketServer({ port: PORT, maxPayload: 5 * 1024 * 1024, perMessageDeflate: false });


wss.on('connection', function connection(ws: WebSocket) {
  console.info("WebSocket client connected");
  const user = new User(ws);
  ws.on('error', (error) => console.error("WebSocket transport error:", error.message));

  ws.on('close', () => {
    user?.destroy();
  });
});

wss.on("listening", () => console.info(`WebSocket server listening on ${PORT}`));
wss.on("error", (error) => console.error("WebSocket server error:", error.message));

void client.$connect().then(
  () => console.info("WebSocket database connection established"),
  (error: unknown) => console.error("WebSocket server could not reach PostgreSQL. Start Docker infrastructure and verify DATABASE_URL:", error instanceof Error ? error.message : "unknown error"),
);
