import { WebSocketServer } from 'ws';
import WebSocket from 'ws';
import { User } from './User';
const PORT = process.env.PORT || 3001 ;

const wss = new WebSocketServer({ port: Number(PORT) });


wss.on('connection', function connection(ws: WebSocket) {
  console.log("user connected")
  const user = new User(ws);
  ws.on('error', console.error);

  ws.on('close', () => {
    user?.destroy();
  });
});