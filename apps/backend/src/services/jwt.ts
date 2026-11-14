import { sign, verify } from "hono/jwt";
import { env } from "../config/env";

export interface JWTPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

function parseExpiry(expiry: string): number {
  const unit = expiry.slice(-1);
  const value = parseInt(expiry.slice(0, -1), 10);
  const now = Math.floor(Date.now() / 1000);
  if (unit === "m") return now + value * 60;
  if (unit === "h") return now + value * 3600;
  if (unit === "d") return now + value * 86400;
  return now + value;
}

export async function signAccessToken(payload: Omit<JWTPayload, "iat" | "exp">): Promise<string> {
  return sign({ ...payload, exp: parseExpiry(env.JWT_ACCESS_EXPIRY) }, env.JWT_SECRET, "HS256");
}

export async function signRefreshToken(payload: Omit<JWTPayload, "iat" | "exp">): Promise<string> {
  return sign({ ...payload, exp: parseExpiry(env.JWT_REFRESH_EXPIRY) }, env.JWT_SECRET, "HS256");
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const payload = await verify(token, env.JWT_SECRET, "HS256");
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}
