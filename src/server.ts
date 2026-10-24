import { serve } from "@hono/node-server";
import { env } from "./config/env";
import app from "@/app";
import { logger } from "./utils/logger";

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  logger.info(` DevInsight AI backend jalan di http://localhost:${info.port}`);
});
