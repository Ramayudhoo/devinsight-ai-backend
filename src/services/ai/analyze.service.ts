import { buildDeveloperContext } from "@/services/github/github-aggregator.service";
import { callAi } from "@/providers/openai.provider";
import {
  ANALYZE_SYSTEM_PROMPT,
  ROAST_SYSTEM_PROMPT,
  CAREER_ADVICE_SYSTEM_PROMPT,
  buildAnalyzeUserPrompt,
  buildRetryPrompt,
  PORTFOLIO_SCORE_SYSTEM_PROMPT,
} from "./prompt-builder";
import { tryParseAiResponse } from "./response-parser";
import { AiResponseInvalidError } from "@/utils/errors";
import { logger } from "@/utils/logger";
import {
  aiAnalysisSchema,
  type AiAnalysis,
} from "@/schemas/ai-response.schema";
import {
  careerAdviceSchema,
  type CareerAdvice,
} from "@/schemas/ai-response.schema";
import {
  portfolioScoreSchema,
  type PortfolioScore,
} from "@/schemas/ai-response.schema";

import { CACHE_TTL, cacheService } from "../cache/cache.service";
import { z } from "zod";

const MAX_RETRY = 1;

export async function analyzeGithubProfile(
  username: string,
): Promise<{ data: AiAnalysis; cached: boolean }> {
  const { value, cached } = await cacheService.getOrSet(
    `ai-analysis:${username}`,
    CACHE_TTL.AI_RESULT_MS,
    () => runWithPrompt(username, ANALYZE_SYSTEM_PROMPT, aiAnalysisSchema),
  );

  if (cached) logger.info({ username }, "Hasil analisis AI diambil dari cache");
  return { data: value, cached };
}

export async function roastGithubProfile(
  username: string,
): Promise<{ data: AiAnalysis; cached: boolean }> {
  const { value, cached } = await cacheService.getOrSet(
    `ai-roast:${username}`,
    CACHE_TTL.AI_RESULT_MS,
    () => runWithPrompt(username, ROAST_SYSTEM_PROMPT, aiAnalysisSchema),
  );

  if (cached) logger.info({ username }, "Hasil roast AI diambil dari cache");
  return { data: value, cached };
}

export async function careerAdviceForProfile(
  username: string,
): Promise<{ data: CareerAdvice; cached: boolean }> {
  const { value, cached } = await cacheService.getOrSet(
    `ai-career:${username}`,
    CACHE_TTL.AI_RESULT_MS,
    () =>
      runWithPrompt(username, CAREER_ADVICE_SYSTEM_PROMPT, careerAdviceSchema),
  );

  if (cached)
    logger.info({ username }, "Hasil career advice diambil dari cache");
  return { data: value, cached };
}

/**
 * Function generic yang menerima schema Zod sebagai parameter -
 * dipakai oleh analyze, roast, dan career-advice. Beda system prompt
 * dan beda schema output, tapi flow (fetch context -> call AI ->
 * validate -> retry) tetap sama persis.
 */
async function runWithPrompt<T>(
  username: string,
  systemPrompt: string,
  schema: z.ZodType<T>,
): Promise<T> {
  const context = await buildDeveloperContext(username);
  const userPrompt = buildAnalyzeUserPrompt(context);

  let rawOutput = await callAi({ systemPrompt, userPrompt });
  let result = tryParseAiResponse(rawOutput, schema);

  let attempt = 0;
  while (!result.success && attempt < MAX_RETRY) {
    attempt++;
    logger.warn(
      { username, attempt, error: result.error },
      "AI response gagal validasi, mencoba ulang",
    );

    const retryPrompt = buildRetryPrompt(rawOutput, result.error);
    rawOutput = await callAi({ systemPrompt, userPrompt: retryPrompt });
    result = tryParseAiResponse(rawOutput, schema);
  }

  if (!result.success) {
    throw new AiResponseInvalidError();
  }

  return result.data;
}

export async function scorePortfolio(
  username: string,
): Promise<{ data: PortfolioScore; cached: boolean }> {
  const { value, cached } = await cacheService.getOrSet(
    `ai-portfolio-score:${username}`,
    CACHE_TTL.AI_RESULT_MS,
    () =>
      runWithPrompt(
        username,
        PORTFOLIO_SCORE_SYSTEM_PROMPT,
        portfolioScoreSchema,
      ),
  );

  if (cached) {
    logger.info({ username }, "Hasil portfolio score diambil dari cache");
  }

  return { data: value, cached };
}
