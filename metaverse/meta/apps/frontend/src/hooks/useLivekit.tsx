import { useState, useCallback } from "react";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import { getHttpFailure } from "@/lib/httpError";

type LiveKitTokenResponse = { token: string; url: string };

export function useLiveKit(spaceId: string) {
  const { BACKEND_URL, token: authToken } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [livekitUrl, setLivekitUrl] = useState<string | null>(null);
  const [isRequestingToken, setIsRequestingToken] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async (): Promise<boolean> => {
    if (!spaceId || !authToken) {
      setError("Sign in before starting a video call.");
      return false;
    }
    if (isRequestingToken) return false;

    setError(null);
    setIsRequestingToken(true);
    try {
      const response = await axios.post<LiveKitTokenResponse>(
        `${BACKEND_URL}/api/v1/livekit/token`,
        { spaceId },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      if (!response.data.token || !response.data.url) throw new Error("The video service returned an incomplete connection response.");
      setToken(response.data.token);
      setLivekitUrl(response.data.url);
      return true;
    } catch (requestError) {
      setError(getHttpFailure(requestError, "Unable to start the video call.").message);
      return false;
    } finally {
      setIsRequestingToken(false);
    }
  }, [BACKEND_URL, authToken, isRequestingToken, spaceId]);

  const disconnect = useCallback(() => {
    setToken(null);
    setLivekitUrl(null);
    setError(null);
  }, []);

  return {
    token,
    livekitUrl,
    isRequestingToken,
    error,
    setError,
    connect,
    disconnect,
  };
}
