import { useCallback, useEffect, useRef, useState } from "react";
import SimplePeer from "simple-peer";

type SimplePeerInstance = InstanceType<typeof SimplePeer>;

interface PeerStream {
  peerId: string;
  stream: MediaStream;
  muted?: boolean;
  speaking?: boolean;
}

interface AudioAnalyserData {
  audioCtx: AudioContext;
  analyser: AnalyserNode;
  rafId: number | null;
}

export function useVideoCall(ws: WebSocket | null, userId: string | undefined) {
  const [peers, setPeers] = useState<{ [peerId: string]: SimplePeerInstance }>({});
  const [peerStreams, setPeerStreams] = useState<PeerStream[]>([]);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const localStreamRef = useRef<MediaStream | null>(null);
const peersRef = useRef<{ [peerId: string]: SimplePeerInstance }>({});

  // Store per-peer audio analyser data for reuse and cleanup
  const audioAnalyserMap = useRef<{ [peerId: string]: AudioAnalyserData }>({});
  useEffect(() => {
  peersRef.current = peers;
}, [peers]);


  const detectSpeaking = useCallback((stream: MediaStream, peerId: string) => {
    // Clean up existing analyser for this peer if exists
    if (audioAnalyserMap.current[peerId]) {
      const prev = audioAnalyserMap.current[peerId];
      if (prev.rafId !== null) cancelAnimationFrame(prev.rafId);
      prev.analyser.disconnect();
      prev.audioCtx.close();
      delete audioAnalyserMap.current[peerId];
    }

    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);

    let lastUpdateTime = 0;

    const check = () => {
      const now = performance.now();
      if (now - lastUpdateTime > 100) { // throttle to 100ms
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((sum, val) => sum + val, 0) / data.length;
        const isSpeaking = avg > 30;

        setPeerStreams((prev) =>
          prev.map((p) =>
            p.peerId === peerId && p.speaking !== isSpeaking ? { ...p, speaking: isSpeaking } : p
          )
        );

        lastUpdateTime = now;
      }
      audioAnalyserMap.current[peerId].rafId = requestAnimationFrame(check);
    };

    audioAnalyserMap.current[peerId] = {
      audioCtx,
      analyser,
      rafId: null,
    };

    audioAnalyserMap.current[peerId].rafId = requestAnimationFrame(check);
  }, []);

  const startVideo = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = stream;

    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: "start-video",
          payload: { userId },
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

  const startScreenShare = useCallback(async () => {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    const screenTrack = screenStream.getVideoTracks()[0];

    const stream = localStreamRef.current;
    if (!stream) return;

    const [oldTrack] = stream.getVideoTracks();
    stream.removeTrack(oldTrack);
    stream.addTrack(screenTrack);

    localStreamRef.current = stream;

    Object.values(peers).forEach((peer) => {
      peer.replaceTrack(oldTrack, screenTrack, stream);
    });

    setIsScreenSharing(true);

    screenTrack.onended = async () => {
      setIsScreenSharing(false);
      await startVideo();

      const newCameraTrack = localStreamRef.current?.getVideoTracks()[0];
      if (!newCameraTrack) return;

      Object.values(peers).forEach((peer) => {
        peer.replaceTrack(screenTrack, newCameraTrack, localStreamRef.current!);
      });
    };
  }, [peers, startVideo]);

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
            payload: { from: initiatorId, to: receiverId, signal },
          })
        );
      });

      peer.on("stream", (stream) => {
        const audioTrack = stream.getAudioTracks()[0];
        const isMuted = audioTrack?.enabled === false;

        if (audioTrack) {
          audioTrack.onmute = () => {
            setPeerStreams((prev) =>
              prev.map((ps) => (ps.peerId === receiverId ? { ...ps, muted: true } : ps))
            );
          };
          audioTrack.onunmute = () => {
            setPeerStreams((prev) =>
              prev.map((ps) => (ps.peerId === receiverId ? { ...ps, muted: false } : ps))
            );
          };
        }

        setPeerStreams((prev) => {
          const filtered = prev.filter((p) => p.peerId !== receiverId);
          return [...filtered, { peerId: receiverId, stream, muted: isMuted, speaking: false }];
        });

        detectSpeaking(stream, receiverId);
      });

      return peer;
    },
    [ws, detectSpeaking]
  );

  useEffect(() => {
  if (!ws) return;

  const handleMessage = (event: MessageEvent) => {
    const message = JSON.parse(event.data);

    if (message.type === "start-video" && message.payload.userId !== userId) {
      const peerId = message.payload.userId;
      if (peersRef.current[peerId]) return; // prevent duplication

      const peer = createPeer(userId!, peerId, true);
      setPeers((prev) => ({ ...prev, [peerId]: peer }));
    }

    if (message.type === "video-signal") {
      const { from, to, signal } = message.payload;
      if (to !== userId) return;

      let peer = peersRef.current[from];
      if (!peer) {
        peer = createPeer(userId!, from, false);
        setPeers((prev) => ({ ...prev, [from]: peer }));
      }
      peer.signal(signal);
    }

    if (message.type === "stop-video" && message.payload.userId !== userId) {
      const peerId = message.payload.userId;

      if (peersRef.current[peerId]) {
        peersRef.current[peerId].destroy();
        delete peersRef.current[peerId];
        setPeers({ ...peersRef.current });
        setPeerStreams((prev) => prev.filter((stream) => stream.peerId !== peerId));

        const analyserData = audioAnalyserMap.current[peerId];
        if (analyserData) {
          if (analyserData.rafId !== null) cancelAnimationFrame(analyserData.rafId);
          analyserData.analyser.disconnect();
          analyserData.audioCtx.close();
          delete audioAnalyserMap.current[peerId];
        }
      }
    }
  };

  ws.addEventListener("message", handleMessage);

  return () => {
    ws.removeEventListener("message", handleMessage);

    Object.values(peersRef.current).forEach((peer) => peer.destroy());

    Object.values(audioAnalyserMap.current).forEach(({ rafId, analyser, audioCtx }) => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      analyser.disconnect();
      audioCtx.close();
    });

    audioAnalyserMap.current = {};
  };
}, [ws, userId, createPeer]);


  return {
    startVideo,
    stopVideo,
    startScreenShare,
    isScreenSharing,
    localStream: localStreamRef.current,
    peerStreams,
  };
}


//This useVideoCall custom React hook provides functionality for managing video calls using WebSockets for signaling and SimplePeer for WebRTC peer-to-peer connections.

// Workflow Overview
// The core idea is to establish a WebRTC peer-to-peer connection between users for real-time video and audio communication. A WebSocket connection is used as a signaling channel to exchange metadata (like SDP offers/answers and ICE candidates) needed to set up these direct peer connections.