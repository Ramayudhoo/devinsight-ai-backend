import { buildDeveloperContext } from "@/services/github/github-aggregator.service";
import { callAi } from "@/providers/openai.provider";
import {
  COMPARE_SYSTEM_PROMPT,
  buildCompareUserPrompt,
  buildRetryPrompt,
} from "./prompt-builder";
import { tryParseAiResponse } from "./response-parser";
import {
  compareResultSchema,
  type CompareResult,
} from "@/schemas/ai-response.schema";
import { AiResponseInvalidError } from "@/utils/errors";
import { logger } from "@/utils/logger";
import { cacheService, CACHE_TTL } from "@/services/cache/cache.service";

const MAX_RETRY = 1;

export async function compareGithubProfiles(
  usernameA: string,
  usernameB: string,
): Promise<{ data: CompareResult; cached: boolean }> {
  // Cache key diurutkan alfabetis dulu, supaya compare(A, B) dan compare(B, A)
  // dianggap request yang sama dan bisa saling pakai cache.
  const [first, second] = [usernameA, usernameB].sort();
  const cacheKey = `ai-compare:${first}:${second}`;

  const { value, cached } = await cacheService.getOrSet(
    cacheKey,
    CACHE_TTL.AI_RESULT_MS,
    () => runCompare(usernameA, usernameB),
  );

  if (cached) {
    logger.info({ usernameA, usernameB }, "Hasil compare diambil dari cache");
  }

  return { data: value, cached };
}

async function runCompare(
  usernameA: string,
  usernameB: string,
): Promise<CompareResult> {
  // Ambil 2 context PARALEL - tidak saling bergantung
  const [contextA, contextB] = await Promise.all([
    buildDeveloperContext(usernameA),
    buildDeveloperContext(usernameB),
  ]);

  const userPrompt = buildCompareUserPrompt(contextA, contextB);

  let rawOutput = await callAi({
    systemPrompt: COMPARE_SYSTEM_PROMPT,
    userPrompt,
  });
  let result = tryParseAiResponse(rawOutput, compareResultSchema);

  let attempt = 0;
  while (!result.success && attempt < MAX_RETRY) {
    attempt++;
    logger.warn(
      { usernameA, usernameB, attempt, error: result.error },
      "AI response gagal validasi, mencoba ulang",
    );

    const retryPrompt = buildRetryPrompt(rawOutput, result.error);
    rawOutput = await callAi({
      systemPrompt: COMPARE_SYSTEM_PROMPT,
      userPrompt: retryPrompt,
    });
    result = tryParseAiResponse(rawOutput, compareResultSchema);
  }

  if (!result.success) {
    throw new AiResponseInvalidError();
  }

  return result.data;
}
