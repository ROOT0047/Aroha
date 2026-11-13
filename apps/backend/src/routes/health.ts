import { Hono } from "hono";

export const healthRouter = new Hono();

healthRouter.get("/", (c) => {
  return c.json({
    status: "ok",
    service: "aroha-backend",
    timestamp: new Date().toISOString(),
  });
});
