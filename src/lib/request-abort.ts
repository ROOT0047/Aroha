const CAUSE_DEPTH_LIMIT = 5;

export function isClientDisconnectError(error: unknown): boolean {
  let current = error;
  const seen = new Set<object>();

  for (let depth = 0; depth < CAUSE_DEPTH_LIMIT && current != null; depth++) {
    if (typeof current !== "object" || seen.has(current)) return false;
    seen.add(current);

    const candidate = current as {
      cause?: unknown;
      code?: unknown;
      message?: unknown;
      name?: unknown;
      stack?: unknown;
    };

    if (candidate.name === "AbortError" || candidate.code === "ECONNRESET") return true;
    if (
      candidate.message === "aborted" &&
      typeof candidate.stack === "string" &&
      /abortIncoming|socketOnClose/.test(candidate.stack)
    ) {
      return true;
    }

    current = candidate.cause;
  }

  return false;
}

export function clientDisconnectResponse(): Response {
  return new Response(null, { status: 499 });
}
