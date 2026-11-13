import type { MiddlewareHandler } from "hono";
import { createAuthClient } from "../services/supabase";

export type AuthContextVariables = {
  userId: string;
  supabase: ReturnType<typeof createAuthClient>;
};

export const requireAuth: MiddlewareHandler<{
  Variables: AuthContextVariables;
}> = async (c, next) => {
  const authHeader = c.req.header("authorization");

  if (!authHeader) {
    return c.json({ error: "Unauthorized: No authorization header provided" }, 401);
  }

  if (!authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized: Only Bearer tokens are supported" }, 401);
  }

  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) {
    return c.json({ error: "Unauthorized: No token provided" }, 401);
  }

  const supabase = createAuthClient(token);
  const { data, error } = await supabase.auth.getClaims(token);

  if (error || !data?.claims || !data.claims.sub) {
    // Fallback verification using getUser
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user?.id) {
      return c.json({ error: "Unauthorized: Invalid or expired token" }, 401);
    }
    c.set("userId", userData.user.id);
    c.set("supabase", supabase);
    return next();
  }

  c.set("userId", data.claims.sub);
  c.set("supabase", supabase);
  return next();
};
