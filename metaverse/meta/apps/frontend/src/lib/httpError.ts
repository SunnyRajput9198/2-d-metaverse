type HttpFailure = {
  message: string;
  status?: number;
};

export function getHttpFailure(error: unknown, fallback: string): HttpFailure {
  if (!error || typeof error !== "object") return { message: fallback };

  const candidate = error as { message?: unknown; response?: unknown };
  const response = candidate.response;
  if (response && typeof response === "object") {
    const responseData = response as { status?: unknown; data?: unknown };
    const data = responseData.data;
    const message = data && typeof data === "object" && "message" in data && typeof data.message === "string"
      ? data.message
      : undefined;
    return {
      message: message || (typeof candidate.message === "string" ? candidate.message : fallback),
      status: typeof responseData.status === "number" ? responseData.status : undefined,
    };
  }

  return { message: typeof candidate.message === "string" ? candidate.message : fallback };
}
