import { LiveKitRoom } from "@livekit/components-react";
import "@livekit/components-styles";
import { VideoCallPanel } from "@/components/VideoCallPanel";

type Props = {
  token: string;
  serverUrl: string;
  minimized: boolean;
  onMinimize: () => void;
  onEnd: () => void;
  onError: (message: string | null) => void;
};

export default function LiveKitCall({ token, serverUrl, minimized, onMinimize, onEnd, onError }: Props) {
  return (
    <LiveKitRoom token={token} serverUrl={serverUrl} connect audio video onConnected={() => onError(null)} onError={(error) => onError(error.message || "Unable to connect to the video service.")} onMediaDeviceFailure={(failure) => onError(failure ? `Camera or microphone permission was not granted: ${failure}` : "Camera or microphone is unavailable.")}>
      <VideoCallPanel minimized={minimized} onMinimize={onMinimize} onEnd={onEnd} />
    </LiveKitRoom>
  );
}
