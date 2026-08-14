import { Hono } from "hono";
import { compareHandler } from "@/controllers/compare.controller";
import { rateLimiter } from "@/middlewares/rate-limiter.middleware";
import { env } from "@/config/env";

export const compareRoute = new Hono();

compareRoute.post(
  "/compare",
  rateLimiter({ windowMs: 60_000, limit: env.RATE_LIMIT_ANALYZE_PER_MIN }),
  compareHandler,
);
