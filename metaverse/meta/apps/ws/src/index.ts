import { WebSocketServer } from 'ws';
import WebSocket from 'ws';
import { User } from './User';

const PORT = process.env.PORT || 3001;
// @ts-ignore
const wss = new WebSocketServer({ port: PORT });


wss.on('connection', function connection(ws: WebSocket) {
  console.log("user connected")
  let user = new User(ws);
  ws.on('error', console.error);

  ws.on('close', () => {
    user?.destroy();
  });
});