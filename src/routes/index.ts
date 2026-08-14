import { Hono } from "hono";
import { ok } from "@/utils/response";
import { profileRoute } from "./profile.route";
import { analyzeRoute } from "./analyze.route";
import { compareRoute } from "./compare.route";
import { repositoryReviewRoute } from "./repository-review.route";

export const routes = new Hono();

routes.get("/health", (c) =>
  ok(c, { status: "ok", timestamp: new Date().toISOString() }),
);

routes.route("/", profileRoute);
routes.route("/", analyzeRoute);
routes.route("/", compareRoute);
routes.route("/", repositoryReviewRoute);
