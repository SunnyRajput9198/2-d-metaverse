import { useCallback, useEffect, useRef, useState } from "react";
import SimplePeer from "simple-peer";

type SimplePeerInstance = InstanceType<typeof SimplePeer>;
interface PeerStream {
  peerId: string;
  stream: MediaStream;
  muted?: boolean;//ismuted or not
  speaking?: boolean;//who is speaking
}
export function useVideoCall(ws: WebSocket | null, userId: string | undefined) {

  const [peers, setPeers] = useState<{ [peerId: string]: SimplePeerInstance }>({});//peers is a state object in React, which is used to store SimplePeer instances. It is initialized as an empty object.
  const [peerStreams, setPeerStreams] = useState<PeerStream[]>([]);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const localStreamRef = useRef<MediaStream | null>(null);//useref is a hook that allows you to create a mutable reference that persists across re-renders, store references to DOM elements
  function detectSpeaking(stream: MediaStream, peerId: string) {
    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    const data = new Uint8Array(analyser.frequencyBinCount);
    source.connect(analyser);

    const check = () => {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((sum, val) => sum + val, 0) / data.length;

      const isSpeaking = avg > 30;
      setPeerStreams((prev) =>
        prev.map((p) =>
          p.peerId === peerId ? { ...p, speaking: isSpeaking } : p
        )
      );

      requestAnimationFrame(check);
    };

    check();
  }
  //useCallback memoized function for initiating vide0 -a memoized function is a function that will only be recreated if its dependencies change
  //navigator: This is a global object in web browsers that provides information about the user agent (the browser itself) and the state of the user's system.
  // mediaDevices: This is a property of the navigator object that provides access to connected media input devices, such as cameras and microphones, as well as screen sharing capabilities. It's part of the MediaDevices API, which is a Web API (Application Programming Interface).
  //getUserMedia(): This is a method provided by the mediaDevices interface. It's designed to prompt the user for permission to use their audio and/or video input devices

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
    localStreamRef.current?.getTracks().forEach((track) => track.stop());// is responsible for stopping all the media tracks (like video and audio) within a MediaStream, effectively turning off the camera and microphone and releasing those resources.->.getTracks(): This method returns an array of the media tracks in the MediaStream object.
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

  // Replace local video track in the stored local stream
  const [oldTrack] = stream.getVideoTracks();
  stream.removeTrack(oldTrack);
  stream.addTrack(screenTrack);
  //update localstreamRef with modified stream
 localStreamRef.current = stream;
  // ✅ Replace the track in each peer using official method
  Object.values(peers).forEach((peer) => {
    peer.replaceTrack(oldTrack, screenTrack, stream);
  });

  setIsScreenSharing(true);

  screenTrack.onended = async () => {
    setIsScreenSharing(false);
    await startVideo(); // this reinitializes localStreamRef with camera

    const newCameraTrack = localStreamRef.current?.getVideoTracks()[0];
    if (!newCameraTrack) return;

    Object.values(peers).forEach((peer) => {
      peer.replaceTrack(screenTrack, newCameraTrack, localStreamRef.current!);
    });
  };
}, [peers, startVideo]);




  //initiatorId: This parameter represents the userId of the local user (the one calling createPeer).
  // receiverId: This parameter represents the userId of the remote user (the one being connected to).
  // initiator: This parameter represents whether the local user is the initiator of the connection (true) or the receiver (false).//If true: This peer will immediately generate an SDP Offer (Session Description Protocol Offer) and send it out via its 'signal' event. It takes the active role in initiating the connection.
  // If false: This peer will wait to receive an SDP Offer from the remote peer. Once it receives an offer via peer.signal(offer), it will process it and then generate an SDP Answer, which it will send back via its 'signal' event. It takes the passive role.
  // trickle: false:
  // ICE (Interactive Connectivity Establishment) is a framework that helps WebRTC peers find the best way to connect to each other, often involving NAT traversal and firewalls. It does this by discovering "ICE candidates" (potential network addresses).
  // Trickle ICE (when trickle is true, which is the default for SimplePeer) means that ICE candidates are generated and exchanged as soon as they are discovered. This speeds up connection setup but requires more frequent signaling messages.
  // Non-Trickle ICE (when trickle is false, as it is here) means that SimplePeer will wait until all ICE candidates have been gathered before bundling them together with the SDP (offer or answer) and sending them in a single 'signal' event.
  // Pros of trickle: false: Fewer signaling messages. Can simplify server-side routing as one large message contains all necessary initial setup info.
  // Cons of trickle: false: Can slightly delay connection setup because the peer has to wait for all candidates to be gathered before sending the initial signal. For real-time applications, trickle: true is often preferred for faster connection times. The choice here is a design decision; false might be chosen for simpler signaling logic.
  //localStreamRef.current: This is the MediaStream object (containing the user's camera and microphone tracks) obtained from navigator.mediaDevices.getUserMedia().
  const createPeer = useCallback(
    (initiatorId: string, receiverId: string, initiator: boolean) => {
      const peer = new SimplePeer({
        initiator,
        trickle: false,
        stream: localStreamRef.current || undefined,
      });
      //peer.on(...): This is how you set up an event listener on a SimplePeer instance. SimplePeer emits various events to notify your application about its internal state and actions.
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
      //stream": This is the specific event that SimplePeer emits when it successfully receives a MediaStream from the remote peer.
      // This typically happens after the WebRTC connection (the underlying RTCPeerConnection) has been established and the remote peer has added its own MediaStream (e.g., from their camera and microphone) to their side of the connection.
      peer.on("stream", (stream) => {
        const audioTrack = stream.getAudioTracks()[0];
        const isMuted = audioTrack?.enabled === false;

        // Listen to mute changes
        if (audioTrack) {
          audioTrack.onmute = () => {
            setPeerStreams((prev) =>
              prev.map((ps) =>
                ps.peerId === receiverId ? { ...ps, muted: true } : ps
              )
            );
          };
          audioTrack.onunmute = () => {
            setPeerStreams((prev) =>
              prev.map((ps) =>
                ps.peerId === receiverId ? { ...ps, muted: false } : ps
              )
            );
          };
        }

        setPeerStreams((prev) => [...prev, { peerId: receiverId, stream, muted: isMuted }]);
        detectSpeaking(stream, receiverId);

      });

      return peer;
    },
    [ws]
  );

  useEffect(() => {
    if (!ws) return;

    ws.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      //When User B starts their video, they send a "start-video" message. User A receives this message. Upon receiving it, User A recognizes that User B wants to start a call. User A then proactively creates a SimplePeer instance, setting itself as the initiator for the connection with User B. This SimplePeer instance will then generate the initial SDP offer to send to User B, beginning the WebRTC connection negotiation.
      //message.payload.userId !== userId: This is a very important condition. It ensures that the current client does not react to its own "start-video" message. When a user starts their video, their startVideo function sends this message. If this condition weren't here, the client would receive its own message and try to create a peer connection to itself, leading to errors or unexpected behavior. This ensures that only other users' "start-video" messages are processed.
      if (message.type === "start-video" && message.payload.userId !== userId) {
        const peerId = message.payload.userId;
        const peer = createPeer(userId!, peerId, true);
        setPeers((prev) => ({ ...prev, [peerId]: peer }));
      }
      //(prev) => ({ ...prev, [peerId]: peer }): This is a functional update to the state.
      // prev: Represents the previous state of the peers object.
      // ...prev: Spreads all the existing peer connections from the previous state into a new object.
      // [peerId]: peer: Adds the newly created peer instance to the object, using the peerId of the remote user as the key.

      //This if block is the core of the signaling mechanism for WebRTC peer connections. It handles the exchange of crucial metadata (SDP offers/answers and ICE candidates) between peers, which is necessary for SimplePeer to establish a direct connection.
      //from: The userId of the sender of this signal message. This tells us which remote peer this signal originated from.
      // to: The userId of the intended recipient of this signal message. This is crucial for the signaling server to route the message correctly and for the client to verify it's for them.
      // signal: This is the actual WebRTC signaling data generated by SimplePeer. It can be an SDP (Session Description Protocol) offer, an SDP answer, or an ICE (Interactive Connectivity Establishment) candidate.
      // his video-signal handler acts as the traffic controller for WebRTC's signaling messages. It ensures that incoming signals are routed to the correct SimplePeer instance. If a connection with the sender doesn't exist yet, it creates one (as a responder). Then, it passes the signal data to the SimplePeer instance, allowing it to progress with the WebRTC handshake and eventually establish a direct peer-to-peer connection for media streaming.
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

      /* What happens when peer.signal(signal) is called:
       If signal is an SDP(session description protocol) Offer: The SimplePeer instance processes the offer, sets up its remote description, and then generates its own SDP Answer. This answer will then be emitted via the peer.on("signal", ...) event listener, which sends it back to the original offerer via the WebSocket.
       If signal is an SDP Answer: The SimplePeer instance processes the answer, sets up its remote description, and the SDP exchange is complete.
       If signal is an ICE(Interactive Connectivity Establishment) Candidate: The SimplePeer instance adds this candidate to its list of potential network paths to connect to the remote peer. This helps in NAT traversal and finding the most efficient way for data to flow directly between peers.
      This section of the code handles the disconnection and cleanup of peer connections when a remote user stops their video. It also includes the crucial cleanup logic that runs when the component unmounts or its dependencies change.*/
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
    //     //setPeers({ ...peers });
    // Since peers is a state object in React, directly modifying it with delete won't trigger a re-render. To ensure React recognizes the change and updates the UI (if any UI elements depend on the peers state), you need to create a new object.
    // { ...peers }: This uses the spread syntax to create a shallow copy of the peers object after the delete operation. By providing a new object to setPeers, React detects the state change and re-renders components that rely on peers.

    return () => {
      //Object.values(peers): This gets an array of all the SimplePeer instances currently stored in the peers object.
      Object.values(peers).forEach((peer) => peer.destroy());
    };
  }, [ws, peers, userId, createPeer]);

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