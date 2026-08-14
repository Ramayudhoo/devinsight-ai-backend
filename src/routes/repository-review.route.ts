import { Hono } from "hono";
import { repositoryReviewHandler } from "@/controllers/repository-review.controller";
import { rateLimiter } from "@/middlewares/rate-limiter.middleware";
import { env } from "@/config/env";

export const repositoryReviewRoute = new Hono();

repositoryReviewRoute.post(
  "/repository-review",
  rateLimiter({ windowMs: 60_000, limit: env.RATE_LIMIT_ANALYZE_PER_MIN }),
  repositoryReviewHandler,
);
