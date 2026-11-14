import type { MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import { verifyToken, type JWTPayload } from "../services/jwt";

export type JwtContextVariables = {
  jwtPayload: JWTPayload;
  userId: string;
};

export const requireJwt: MiddlewareHandler<{ Variables: JwtContextVariables }> = async (c, next) => {
  let token: string | undefined;

  // 1. Authorization header
  const authHeader = c.req.header("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7).trim();
  }

  // 2. HttpOnly cookie fallback
  if (!token) {
    token = getCookie(c, "aroha_access_token");
  }

  if (!token) {
    return c.json({ error: "Unauthorized: No token provided" }, 401);
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return c.json({ error: "Unauthorized: Invalid or expired token" }, 401);
  }

  c.set("jwtPayload", payload);
  c.set("userId", payload.sub);
  return next();
};
