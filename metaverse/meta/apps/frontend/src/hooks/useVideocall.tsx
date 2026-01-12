import { useCallback, useEffect, useRef, useState } from "react";
import SimplePeer from "simple-peer";

type SimplePeerInstance = InstanceType<typeof SimplePeer>;

interface PeerStream {
  peerId: string;
  stream: MediaStream;
  muted?: boolean;
  speaking?: boolean;
}
// mediastream =output of peer connection
// /rafId is the ID returned by requestAnimationFrame(), so you can stop (cancel) that animation loop later.
interface AudioAnalyserData {
  audioCtx: AudioContext;
  analyser: AnalyserNode;
  rafId: number | null;
}
// ws = signaling channel to send and receive messages. userId = userId of the user who is calling
export function useVideoCall(ws: WebSocket | null, userId: string | undefined) {
  // React state storing active peer connections and their media streams
  const [peers, setPeers] = useState<{ [peerId: string]: SimplePeerInstance }>({});
// List of remote users’ streams and their muted/speaking status
  const [peerStreams, setPeerStreams] = useState<PeerStream[]>([]);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  // Stores your own camera / mic / screen stream
  const localStreamRef = useRef<MediaStream | null>(null);

  // A non-reactive mirror of peers state for use in callbacks and cleanup
// Without this → duplicate peers / bugs
const peersRef = useRef<{ [peerId: string]: SimplePeerInstance }>({});

// Store per-peer audio analyser data for reuse and cleanup
 const audioAnalyserMap = useRef<{ [peerId: string]: AudioAnalyserData }>({});

  // Keeps ref in sync with state
  useEffect(() => {
  peersRef.current = peers;
}, [peers]);


 const detectSpeaking = useCallback(
  (stream: MediaStream, peerId: string) => {
    /* ---------------------------------------------------------
       CLEANUP: Ensure only ONE analyser exists per peer
       If the peer reconnects or stream changes, the old
       analyser + animation loop MUST be stopped to avoid
       memory leaks and CPU overuse.
    ----------------------------------------------------------*/
    const existingAnalyser = audioAnalyserMap.current[peerId];

    if (existingAnalyser) {
      console.log(`[Audio] Cleaning up analyser for peer ${peerId}`);

      if (existingAnalyser.rafId !== null) {
        cancelAnimationFrame(existingAnalyser.rafId);
      }

      existingAnalyser.analyser.disconnect();
      existingAnalyser.audioCtx.close();

      delete audioAnalyserMap.current[peerId];
    }

    /* ---------------------------------------------------------
       AUDIO PIPELINE SETUP
       MediaStream → AudioContext → AnalyserNode
       This allows us to measure audio energy in real time
    ----------------------------------------------------------*/
    console.log(`[Audio] Initializing analyser for peer ${peerId}`);

    const audioCtx = new AudioContext();

    // Convert MediaStream into an audio signal
    const source = audioCtx.createMediaStreamSource(stream);

    // AnalyserNode measures audio levels (does NOT play sound)
    const analyser = audioCtx.createAnalyser();

    // Lower FFT size = faster updates (ideal for speaking detection)
    analyser.fftSize = 256;

    // Connect MediaStream → Analyser
    source.connect(analyser);

    // Buffer to store frequency magnitudes (0 = silence, 255 = loud)
    const data = new Uint8Array(analyser.frequencyBinCount);

    /* ---------------------------------------------------------
       SPEAKING DETECTION LOOP
       Runs continuously using requestAnimationFrame,
       but processes audio only every 100ms to reduce CPU usage
    ----------------------------------------------------------*/
    let lastUpdateTime = 0;

    const check = () => {
      const now = performance.now();

      // Throttle processing to once every 100ms
      if (now - lastUpdateTime > 100) {
        // Populate frequency data
        analyser.getByteFrequencyData(data);

        // Compute average energy across all frequencies
        const avg =
          data.reduce((sum, value) => sum + value, 0) / data.length;

        // Heuristic threshold for detecting human speech
        const isSpeaking = avg > 30;

        // Update speaking state ONLY if it changed
        setPeerStreams((prev) =>
          prev.map((p) =>
            p.peerId === peerId && p.speaking !== isSpeaking
              ? { ...p, speaking: isSpeaking }
              : p
          )
        );

        lastUpdateTime = now;
      }

      // Schedule next frame
      audioAnalyserMap.current[peerId].rafId =
        requestAnimationFrame(check);
    };

    /* ---------------------------------------------------------
       STORE ANALYSER REFERENCES
       Needed later for proper cleanup when peer disconnects
    ----------------------------------------------------------*/
    audioAnalyserMap.current[peerId] = {
      audioCtx,
      analyser,
      rafId: null,
    };

    /* ---------------------------------------------------------
       START THE SPEAKING DETECTION LOOP
    ----------------------------------------------------------*/
    console.log(`[Audio] Speaking detection started for peer ${peerId}`);

    audioAnalyserMap.current[peerId].rafId =
      requestAnimationFrame(check);
  },
  []
);


 const startVideo = useCallback(async () => {
  console.log("[Media] Requesting camera and microphone access");

  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
  });

  localStreamRef.current = stream;

  console.log("[Media] Local camera/mic stream started");

  // Notify other peers via signaling
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(
      JSON.stringify({
        type: "start-video",
        payload: { userId },
      })
    );

    console.log("[Signaling] Sent start-video event");
  }
}, [ws, userId]);

/* --------------------------------------------------------- */

const stopVideo = useCallback(() => {
  console.log("[Media] Stopping local camera and microphone");

  localStreamRef.current?.getTracks().forEach((track) => track.stop());
  localStreamRef.current = null;

  // Notify peers to disconnect
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(
      JSON.stringify({
        type: "stop-video",
        payload: { userId },
      })
    );

    console.log("[Signaling] Sent stop-video event");
  }
}, [ws, userId]);

/* --------------------------------------------------------- */

const startScreenShare = useCallback(async () => {
  console.log("[ScreenShare] Requesting screen capture");

  const screenStream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
  });

  const screenTrack = screenStream.getVideoTracks()[0];
  const stream = localStreamRef.current;

  if (!stream) {
    console.warn("[ScreenShare] No local stream available");
    return;
  }

  const [cameraTrack] = stream.getVideoTracks();

  // Replace camera track with screen track
  stream.removeTrack(cameraTrack);
  stream.addTrack(screenTrack);

  localStreamRef.current = stream;

  console.log("[ScreenShare] Replacing camera track with screen track");

  // Replace track for all connected peers
  Object.values(peers).forEach((peer) => {
    peer.replaceTrack(cameraTrack, screenTrack, stream);
  });

  setIsScreenSharing(true);

  /* ---------------------------------------------------------
     Handle screen sharing stop (user clicks "Stop sharing")
  ----------------------------------------------------------*/
  screenTrack.onended = async () => {
    console.log("[ScreenShare] Screen sharing stopped");

    setIsScreenSharing(false);

    // Restart camera stream
    await startVideo();

    const newCameraTrack = localStreamRef.current?.getVideoTracks()[0];
    if (!newCameraTrack) return;

    console.log("[ScreenShare] Restoring camera track");

    Object.values(peers).forEach((peer) => {
      peer.replaceTrack(screenTrack, newCameraTrack, localStreamRef.current!);
    });
  };
}, [peers, startVideo]);


  const createPeer = useCallback(
  (initiatorId: string, receiverId: string, initiator: boolean) => {
    console.log(
      `[WebRTC] Creating peer connection: ${initiatorId} → ${receiverId} | initiator=${initiator}`
    );

    /* ---------------------------------------------------------
       CREATE PEER CONNECTION
       - initiator=true  → creates SDP offer
       - initiator=false → waits & creates SDP answer
       - trickle=false   → send ICE candidates in one batch
       - stream          → attach local media stream
    ----------------------------------------------------------*/
    const peer = new SimplePeer({
      initiator,
      trickle: false,
      stream: localStreamRef.current || undefined,
    });

    /* ---------------------------------------------------------
       SIGNALING
       SimplePeer bundles:
       - SDP Offer
       - SDP Answer
       - ICE Candidates
       We forward this data via WebSocket
    ----------------------------------------------------------*/
    peer.on("signal", (signal) => {
      console.log(
        `[WebRTC] Sending signal from ${initiatorId} → ${receiverId}`
      );

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

    /* ---------------------------------------------------------
       REMOTE MEDIA RECEIVED
       Fires when peer connection is established
       and audio/video starts flowing
    ----------------------------------------------------------*/
    peer.on("stream", (stream) => {
      console.log(
        `[WebRTC] Remote media stream received from ${receiverId}`
      );

      const audioTrack = stream.getAudioTracks()[0];
      const isMuted = audioTrack?.enabled === false;

      /* ---------------- MUTE / UNMUTE DETECTION ---------------- */
      if (audioTrack) {
        audioTrack.onmute = () => {
          console.log(`[Audio] ${receiverId} muted microphone`);
          setPeerStreams((prev) =>
            prev.map((p) =>
              p.peerId === receiverId ? { ...p, muted: true } : p
            )
          );
        };

        audioTrack.onunmute = () => {
          console.log(`[Audio] ${receiverId} unmuted microphone`);
          setPeerStreams((prev) =>
            prev.map((p) =>
              p.peerId === receiverId ? { ...p, muted: false } : p
            )
          );
        };
      }

      /* ---------------- UPDATE PEER STREAM STATE ---------------- */
      setPeerStreams((prev) => {
        const filtered = prev.filter((p) => p.peerId !== receiverId);
        return [
          ...filtered,
          {
            peerId: receiverId,
            stream,
            muted: isMuted,
            speaking: false,
          },
        ];
      });

      /* ---------------- START SPEAKING DETECTION ---------------- */
      console.log(
        `[Audio] Starting speaking detection for peer ${receiverId}`
      );
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

  /* ---------------------------------------------------------
     START VIDEO → CREATE PEER (INITIATOR)
  ----------------------------------------------------------*/
  if (message.type === "start-video" && message.payload.userId !== userId) {
    const peerId = message.payload.userId;

    console.log(`[Signaling] start-video received from ${peerId}`);

    // Prevent duplicate peer creation
    if (peersRef.current[peerId]) {
      console.log(`[WebRTC] Peer already exists for ${peerId}, skipping`);
      return;
    }

    console.log(`[WebRTC] Creating peer (initiator) → ${peerId}`);
    // initiator = true means YOU are responding to their join You must create the SDP offer
    const peer = createPeer(userId!, peerId, true);

    setPeers((prev) => ({ ...prev, [peerId]: peer }));
  }

  /* ---------------------------------------------------------
     VIDEO SIGNAL → SDP / ICE EXCHANGE
  ----------------------------------------------------------*/
  if (message.type === "video-signal") {
    const { from, to, signal } = message.payload;

    // Ignore signals not meant for this user
    if (to !== userId) return;

    let peer = peersRef.current[from];

    if (!peer) {
      console.log(
        `[WebRTC] Signal received from ${from}, creating peer (answerer)`
      );

      peer = createPeer(userId!, from, false);
      setPeers((prev) => ({ ...prev, [from]: peer }));
    }

    console.log(`[WebRTC] Applying signaling data from ${from}`);
    peer.signal(signal);
  }

  /* ---------------------------------------------------------
     STOP VIDEO → DESTROY PEER + CLEANUP
  ----------------------------------------------------------*/
  if (message.type === "stop-video" && message.payload.userId !== userId) {
    const peerId = message.payload.userId;

    console.log(`[Signaling] stop-video received from ${peerId}`);

    const peer = peersRef.current[peerId];
    if (!peer) return;

    // Destroy WebRTC connection
    peer.destroy();
    delete peersRef.current[peerId];

    setPeers({ ...peersRef.current });

    // Remove UI stream
    setPeerStreams((prev) =>
      prev.filter((stream) => stream.peerId !== peerId)
    );

    /* ----------- CLEAN UP AUDIO ANALYSER ----------- */
    const analyserData = audioAnalyserMap.current[peerId];
    if (analyserData) {
      console.log(`[Audio] Cleaning up analyser for ${peerId}`);

      if (analyserData.rafId !== null) {
        cancelAnimationFrame(analyserData.rafId);
      }

      analyserData.analyser.disconnect();
      analyserData.audioCtx.close();
      delete audioAnalyserMap.current[peerId];
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
// getUserMedia()       → capture media
// WebSocket            → signaling
// SimplePeer           → RTCPeerConnection
// signal()              → SDP + ICE exchange
// peer.on("stream")    → remote media
// replaceTrack()       → screen share
// AudioContext         → speaking detection
// peer.destroy()       → cleanup

// Workflow Overview
// The core idea is to establish a WebRTC peer-to-peer connection between users for real-time video and audio communication. A WebSocket connection is used as a signaling channel to exchange metadata (like SDP offers/answers and ICE candidates) needed to set up these direct peer connections.