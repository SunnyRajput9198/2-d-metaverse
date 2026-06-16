import { Router } from "express";
import { AccessToken } from "livekit-server-sdk";
import { userMiddleware } from "../../middleware/user";

const router = Router();

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || "devkey";
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || "devsecret";

router.post("/token", userMiddleware, async (req, res) => {
  try {
    const { spaceId } = req.body;
    const userId = req.userId;

    if (!spaceId) {
      res.status(400).json({ message: "spaceId is required" });
      return;
    }

    // Create LiveKit access token
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: userId!,
      ttl: "2h", // Token valid for 2 hours
    });

    // Grant permissions
    at.addGrant({
      room: spaceId,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    // Return public-facing URL for browser
    const publicUrl = "ws://localhost:7880";
    
    res.json({
      token,
      url: publicUrl,
    });
  } catch (error) {
    console.error("Error generating LiveKit token:", error);
    res.status(500).json({ message: "Failed to generate token" });
  }
});

export default router;
