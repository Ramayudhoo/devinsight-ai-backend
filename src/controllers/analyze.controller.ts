import type { Context } from "hono";
import { analyzeRequestSchema } from "@/schemas/analyze.schema";
import { usernameParamSchema } from "@/schemas/params.schema";
import {
  analyzeGithubProfile,
  roastGithubProfile,
  careerAdviceForProfile,
  scorePortfolio,
} from "@/services/ai/analyze.service";
import { ok } from "@/utils/response";
import { ValidationError } from "@/utils/errors";

export async function analyzeHandler(c: Context) {
  const body = await c.req.json().catch(() => null);
  const parsed = analyzeRequestSchema.safeParse(body);

  if (!parsed.success) {
    throw new ValidationError(
      parsed.error.issues[0]?.message ?? "Body request tidak valid",
    );
  }

  const { data, cached } = await analyzeGithubProfile(parsed.data.username);
  return ok(c, data, { cached, generatedAt: new Date().toISOString() });
}
export async function roastHandler(c: Context) {
  const body = await c.req.json().catch(() => null);
  const parsed = analyzeRequestSchema.safeParse(body);

  if (!parsed.success) {
    throw new ValidationError(
      parsed.error.issues[0]?.message ?? "Body request tidak valid",
    );
  }

  const { data, cached } = await roastGithubProfile(parsed.data.username);
  return ok(c, data, { cached, generatedAt: new Date().toISOString() });
}

export async function careerAdviceHandler(c: Context) {
  const body = await c.req.json().catch(() => null);
  const parsed = analyzeRequestSchema.safeParse(body);

  if (!parsed.success) {
    throw new ValidationError(
      parsed.error.issues[0]?.message ?? "Body request tidak valid",
    );
  }

  const { data, cached } = await careerAdviceForProfile(parsed.data.username);
  return ok(c, data, { cached, generatedAt: new Date().toISOString() });
}

export async function portfolioScoreHandler(c: Context) {
  const parsed = usernameParamSchema.safeParse({
    username: c.req.param("username"),
  });
  if (!parsed.success) {
    throw new ValidationError(
      parsed.error.issues[0]?.message ?? "Parameter tidak valid",
    );
  }

  const { data, cached } = await scorePortfolio(parsed.data.username);
  return ok(c, data, { cached, generatedAt: new Date().toISOString() });
}
