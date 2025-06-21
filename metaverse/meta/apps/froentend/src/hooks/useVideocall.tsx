// hooks/useVideoCall.ts
import { useCallback, useEffect, useRef, useState } from "react";
import SimplePeer from "simple-peer";

type SimplePeerInstance = InstanceType<typeof SimplePeer>;



interface PeerStream {
  peerId: string;
  stream: MediaStream;
}

export function useVideoCall(ws: WebSocket | null, userId: string | undefined) {
    
  const [peers, setPeers] = useState<{ [peerId: string]: SimplePeerInstance }>({});
  const [peerStreams, setPeerStreams] = useState<PeerStream[]>([]);
  const localStreamRef = useRef<MediaStream | null>(null);

  const startVideo = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = stream;

    // Notify others
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: "start-video",
          payload: {
            userId,
          },
        })
      );
    }
  }, [ws, userId]);

  const stopVideo = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;

    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: "stop-video",
          payload: { userId },
        })
      );
    }
  }, [ws, userId]);

  const createPeer = useCallback(
    (initiatorId: string, receiverId: string, initiator: boolean) => {
      const peer = new SimplePeer({
        initiator,
        trickle: false,
        stream: localStreamRef.current || undefined,
      });

      peer.on("signal", (signal) => {
        ws?.send(
          JSON.stringify({
            type: "video-signal",
            payload: {
              from: initiatorId,
              to: receiverId,
              signal,
            },
          })
        );
      });

      peer.on("stream", (stream) => {
        setPeerStreams((prev) => [...prev, { peerId: receiverId, stream }]);
      });

      return peer;
    },
    [ws]
  );

  useEffect(() => {
    if (!ws) return;

    ws.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);

      if (message.type === "start-video" && message.payload.userId !== userId) {
        const peerId = message.payload.userId;
        const peer = createPeer(userId!, peerId, true);
        setPeers((prev) => ({ ...prev, [peerId]: peer }));
      }

      if (message.type === "video-signal") {
        const { from, to, signal } = message.payload;
        if (to !== userId) return;

        let peer = peers[from];
        if (!peer) {
          peer = createPeer(userId!, from, false);
          setPeers((prev) => ({ ...prev, [from]: peer }));
        }
        peer.signal(signal);
      }

      if (message.type === "stop-video" && message.payload.userId !== userId) {
        const peerId = message.payload.userId;
        if (peers[peerId]) {
          peers[peerId].destroy();
          delete peers[peerId];
          setPeers({ ...peers });
          setPeerStreams((prev) => prev.filter((s) => s.peerId !== peerId));
        }
      }
    });

    return () => {
      Object.values(peers).forEach((peer) => peer.destroy());
    };
  }, [ws, peers, userId, createPeer]);

  return {
    startVideo,
    stopVideo,
    localStream: localStreamRef.current,
    peerStreams,
  };
}
