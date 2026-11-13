import type { MiddlewareHandler } from "hono";

interface WindowEntry {
  timestamps: number[];
}

const store = new Map<string, WindowEntry>();

function getRateLimitKey(prefix: string, identifier: string): string {
  return `${prefix}:${identifier}`;
}

function isRateLimited(key: string, windowMs: number, maxRequests: number): boolean {
  const now = Date.now();
  const entry = store.get(key) ?? { timestamps: [] };
  // Prune old timestamps outside window
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
  if (entry.timestamps.length >= maxRequests) {
    store.set(key, entry);
    return true;
  }
  entry.timestamps.push(now);
  store.set(key, entry);
  return false;
}

export function rateLimiter(options: {
  windowMs: number;
  max: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  keyFn?: (c: any) => string;
  message?: string;
}): MiddlewareHandler {
  return async (c, next) => {
    const ip =
      c.req.header("x-forwarded-for")?.split(",")[0].trim() ??
      c.req.header("x-real-ip") ??
      "unknown";
    const key = options.keyFn
      ? options.keyFn(c)
      : getRateLimitKey(c.req.path, ip);
    if (isRateLimited(key, options.windowMs, options.max)) {
      return c.json(
        { error: options.message || "Too many requests. Please try again later." },
        429,
      );
    }
    return next();
  };
}
