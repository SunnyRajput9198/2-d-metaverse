import { useState, useCallback } from "react";
import axios from "axios";

export function useLiveKit(spaceId: string) {
  const [token, setToken] = useState<string | null>(null);
  const [livekitUrl, setLivekitUrl] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      const response = await axios.post(
        "http://localhost:3000/api/v1/livekit/token",
        { spaceId },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setToken(response.data.token);
      setLivekitUrl(response.data.url);
      console.log("[LiveKit] Token obtained successfully");
    } catch (error) {
      console.error("[LiveKit] Failed to get token:", error);
    } finally {
      setIsConnecting(false);
    }
  }, [spaceId]);

  const disconnect = useCallback(() => {
    setToken(null);
    setLivekitUrl(null);
  }, []);

  return {
    token,
    livekitUrl,
    isConnecting,
    connect,
    disconnect,
  };
}
