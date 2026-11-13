import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { env } from "./config/env";
import { healthRouter } from "./routes/health";
import { coachRouter } from "./routes/coach";
import { reviewRouter } from "./routes/review";

const app = new Hono();

// Global middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: (origin) => {
      if (!origin || env.CORS_ORIGINS.includes(origin) || origin.startsWith("http://localhost:")) {
        return origin || "*";
      }
      return null;
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "apikey"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  }),
);

// Mount API routes
app.route("/api/health", healthRouter);
app.route("/api/coach", coachRouter);
app.route("/api/review", reviewRouter);

// Root greeting
app.get("/", (c) => {
  return c.json({
    service: "AROHA Backend API",
    status: "running",
    endpoints: ["/api/health", "/api/coach", "/api/review"],
  });
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: "Route not found" }, 404);
});

// Global error handler
app.onError((err, c) => {
  console.error("[Backend Error]:", err);
  return c.json(
    {
      error: err.message || "Internal Server Error",
    },
    500,
  );
});

console.log(`[AROHA Backend] Starting server on port ${env.PORT}...`);
serve({
  fetch: app.fetch,
  port: env.PORT,
});
console.log(`[AROHA Backend] Server listening at http://localhost:${env.PORT}`);

export default app;
