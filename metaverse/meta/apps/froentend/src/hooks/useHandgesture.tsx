import { useEffect, useRef } from "react";
import * as handpose from "@tensorflow-models/handpose";
import * as tf from "@tensorflow/tfjs";

export const useHandGesture = (
  videoRef: React.RefObject<HTMLVideoElement | null>,
  onGestureDetected: (gesture: "thumbs_up" | "heart") => void
) => {
  const lastGestureTimeRef = useRef(0);

  useEffect(() => {
    let isMounted = true;

    const detectGesture = async () => {
      console.log("[🧠] Loading handpose model...");
      const model = await handpose.load();
      console.log("[✅] Model loaded!");

      const detectLoop = async () => {
        if (!isMounted) return;

        const video = videoRef.current;
        if (!video) {
          console.log("[🚫] Video ref is null.");
          requestAnimationFrame(detectLoop);
          return;
        }

        const ready = video.readyState === 4;
        if (!ready) {
          console.log("[⏳] Video not ready yet. Current readyState:", video.readyState);
          requestAnimationFrame(detectLoop);
          return;
        }

        console.log("[🎥] Running prediction...");
        const predictions = await model.estimateHands(video);
        console.log("[✋] Predictions:", predictions);

        if (predictions.length > 0) {
          const gesture = classifyGesture(predictions[0].landmarks);
          console.log("[👀] Detected gesture:", gesture);

          const now = Date.now();
          if (gesture && now - lastGestureTimeRef.current > 2000) {
            console.log("[📢] Gesture triggered:", gesture);
            onGestureDetected(gesture);
            lastGestureTimeRef.current = now;
          }
        } else {
          console.log("[🔍] No hand detected.");
        }

        requestAnimationFrame(detectLoop);
      };

      detectLoop();
    };

    detectGesture();

    return () => {
      isMounted = false;
    };
  }, [videoRef, onGestureDetected]);
};

function classifyGesture(
  landmarks: number[][]
): "thumbs_up" | "heart" | null {
  const [thumbTip, indexTip, middleTip, ringTip, pinkyTip] = [
    landmarks[4],
    landmarks[8],
    landmarks[12],
    landmarks[16],
    landmarks[20],
  ];

  console.log("[📌] Landmark positions:");
  console.table({ thumbTip, indexTip, middleTip, ringTip, pinkyTip });

  const thumbUp = thumbTip[1] < indexTip[1] - 30 &&
                  middleTip[1] > indexTip[1] &&
                  ringTip[1] > indexTip[1] &&
                  pinkyTip[1] > indexTip[1];
  if (thumbUp) {
    console.log("[👍] Gesture matched: Thumbs Up");
    return "thumbs_up";
  }

  const fingersTogether =
    Math.abs(indexTip[0] - middleTip[0]) < 30 &&
    Math.abs(middleTip[0] - ringTip[0]) < 30 &&
    Math.abs(ringTip[0] - pinkyTip[0]) < 30;

  const heartShape = fingersTogether && indexTip[1] < thumbTip[1];
  if (heartShape) {
    console.log("[❤️] Gesture matched: Heart");
    return "heart";
  }

  console.log("[❓] No known gesture matched.");
  return null;
}
