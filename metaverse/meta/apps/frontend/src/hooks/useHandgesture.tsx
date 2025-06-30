import { useEffect, useRef } from "react";
import * as handpose from "@tensorflow-models/handpose";
import * as tf from "@tensorflow/tfjs";

// ✅ Global shared model cache
let sharedModel: handpose.HandPose | null = null;
let modelLoadingPromise: Promise<handpose.HandPose> | null = null;

export const useHandGesture = (
  videoRef: React.RefObject<HTMLVideoElement | null>,
  onGestureDetected: (gesture: "thumbs_up" | "heart") => void
) => {
  const lastGestureTimeRef = useRef(0);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;

   const loadModelAndStart = async () => {
  const isWebGLAvailable = () => {
    try {
      const canvas = document.createElement("canvas");
      return !!(
        window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
      );
    } catch (e) {
      return false;
    }
  };

  if (!isWebGLAvailable()) {
    console.warn("❌ WebGL not supported. Hand gesture recognition disabled.");
    return;
  }

  await tf.setBackend("webgl");
  await tf.ready();

  if (!sharedModel) {
    if (!modelLoadingPromise) {
      modelLoadingPromise = handpose.load();
    }
    sharedModel = await modelLoadingPromise;
    console.log("✅ Handpose model loaded and cached");
  }

  const detect = async () => {
    const video = videoRef.current;
    if (!video || video.readyState !== 4 || !isMounted || !sharedModel) {
      rafId.current = requestAnimationFrame(detect);
      return;
    }

    const predictions = await sharedModel.estimateHands(video, true);

    if (predictions.length > 0) {
      const gesture = classifyGesture(predictions[0].landmarks);
      const now = Date.now();

      if (gesture && now - lastGestureTimeRef.current > 2000) {
        onGestureDetected(gesture);
        lastGestureTimeRef.current = now;
      }
    }

    setTimeout(() => {
      rafId.current = requestAnimationFrame(detect);
    }, 100);
  };

  detect();
};


    loadModelAndStart();

    return () => {
      isMounted = false;
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [videoRef, onGestureDetected]);
};

// 👇 Classifier remains the same
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

  const thumbUp =
    thumbTip[1] < indexTip[1] - 30 &&
    middleTip[1] > indexTip[1] &&
    ringTip[1] > indexTip[1] &&
    pinkyTip[1] > indexTip[1];

  if (thumbUp) return "thumbs_up";

  const fingersCloseX =
    Math.abs(indexTip[0] - middleTip[0]) < 20 &&
    Math.abs(middleTip[0] - ringTip[0]) < 20 &&
    Math.abs(ringTip[0] - pinkyTip[0]) < 20;

  const fingersCloseY =
    Math.abs(indexTip[1] - middleTip[1]) < 20 &&
    Math.abs(middleTip[1] - ringTip[1]) < 20 &&
    Math.abs(ringTip[1] - pinkyTip[1]) < 20;

  const thumbUnderFingers =
    thumbTip[1] > indexTip[1] &&
    thumbTip[1] > middleTip[1] &&
    thumbTip[1] > ringTip[1];

  const heartShape = fingersCloseX && fingersCloseY && thumbUnderFingers;

  if (heartShape) return "heart";

  return null;
}
