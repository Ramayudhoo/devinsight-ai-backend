import { Hono } from "hono";
import { cors } from "hono/cors";
import { secureHeaders } from "hono/secure-headers";

import { env } from "@/config/env";
import { routes } from "@/routes";
import { requestLogger } from "@/middlewares/logger.middleware";
import { errorHandler } from "@/middlewares/error-handler.middleware";
import { logger } from "@/utils/logger";

const app = new Hono();

// Global middleware
app.use("*", requestLogger);
app.use("*", secureHeaders());
app.use(
  "*",
  cors({
    origin:
      env.NODE_ENV === "production"
        ? ["https://devinsight-ai.vercel.app"]
        : "*",
  }),
);

// Routes
app.route("/", routes);

// Global error handler (final catch)
app.onError(errorHandler);

// 404 handler
app.notFound((c) =>
  c.json(
    {
      success: false,
      error: { code: "NOT_FOUND", message: "Endpoint tidak ditemukan" },
    },
    404,
  ),
);
export default app;
