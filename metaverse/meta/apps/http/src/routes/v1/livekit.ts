import { Router } from "express";
import { AccessToken } from "livekit-server-sdk";
import { userMiddleware } from "../../middleware/user";
import client from "@repo/db";

const router = Router();

router.post("/token", userMiddleware, async (req, res) => {
  try {
    const spaceId = req.body?.spaceId;
    const userId = req.userId;
    const livekitApiKey = process.env.LIVEKIT_API_KEY;
    const livekitApiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL;

    if (typeof spaceId !== "string" || !spaceId) {
      res.status(400).json({ message: "spaceId is required" });
      return;
    }
    if (!livekitApiKey || !livekitApiSecret || !livekitUrl) {
      res.status(503).json({ message: "LiveKit is not configured" });
      return;
    }

    const [space, user] = await Promise.all([
      client.space.findUnique({ where: { id: spaceId }, select: { id: true } }),
      client.user.findUnique({ where: { id: userId }, select: { username: true } }),
    ]);
    if (!space || !user) {
      res.status(404).json({ message: "Space not found" });
      return;
    }

    const at = new AccessToken(livekitApiKey, livekitApiSecret, {
      identity: userId!,
      name: user.username,
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

    res.json({
      token,
      url: livekitUrl,
    });
  } catch (error) {
    console.error("Error generating LiveKit token:", error instanceof Error ? error.message : "unknown error");
    res.status(500).json({ message: "Failed to generate token" });
  }
});

export default router;
