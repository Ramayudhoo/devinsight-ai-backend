import { Hono } from "hono";
import {
  analyzeHandler,
  roastHandler,
  careerAdviceHandler,
  portfolioScoreHandler,
} from "@/controllers/analyze.controller";
import { rateLimiter } from "@/middlewares/rate-limiter.middleware";
import { env } from "@/config/env";

export const analyzeRoute = new Hono();

analyzeRoute.post(
  "/analyze",
  rateLimiter({ windowMs: 60_000, limit: env.RATE_LIMIT_ANALYZE_PER_MIN }),
  analyzeHandler,
);

analyzeRoute.post(
  "/roast",
  rateLimiter({ windowMs: 60_000, limit: env.RATE_LIMIT_ANALYZE_PER_MIN }),
  roastHandler,
);

analyzeRoute.post(
  "/career-advice",
  rateLimiter({ windowMs: 60_000, limit: env.RATE_LIMIT_ANALYZE_PER_MIN }),
  careerAdviceHandler,
);

analyzeRoute.get(
  "/portfolio-score/:username",
  rateLimiter({ windowMs: 60_000, limit: env.RATE_LIMIT_ANALYZE_PER_MIN }),
  portfolioScoreHandler,
);
