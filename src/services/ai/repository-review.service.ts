import {
  getSingleRepository,
  getRepositoryReadme,
} from "@/services/github/github-repository.service";
import { callAi } from "@/providers/openai.provider";
import {
  REPOSITORY_REVIEW_SYSTEM_PROMPT,
  buildRepositoryReviewUserPrompt,
  buildRetryPrompt,
} from "./prompt-builder";
import { tryParseAiResponse } from "./response-parser";
import {
  repositoryReviewSchema,
  type RepositoryReview,
} from "@/schemas/ai-response.schema";
import { AiResponseInvalidError } from "@/utils/errors";
import { logger } from "@/utils/logger";
import { cacheService, CACHE_TTL } from "@/services/cache/cache.service";

const MAX_RETRY = 1;
const README_MAX_CHARS = 3000; // lebih panjang dari yang di aggregator, karena di sini fokusnya cuma 1 repo

export async function reviewRepository(
  username: string,
  repoName: string,
): Promise<{ data: RepositoryReview; cached: boolean }> {
  const cacheKey = `ai-repo-review:${username}:${repoName}`;

  const { value, cached } = await cacheService.getOrSet(
    cacheKey,
    CACHE_TTL.AI_RESULT_MS,
    () => runReview(username, repoName),
  );

  if (cached) {
    logger.info(
      { username, repoName },
      "Hasil repository review diambil dari cache",
    );
  }

  return { data: value, cached };
}

async function runReview(
  username: string,
  repoName: string,
): Promise<RepositoryReview> {
  const [repo, readme] = await Promise.all([
    getSingleRepository(username, repoName),
    getRepositoryReadme(username, repoName),
  ]);

  const repoData = {
    name: repo.name,
    description: repo.description,
    language: repo.language,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    lastUpdated: repo.pushed_at,
    createdAt: repo.created_at,
    readmeExcerpt: readme ? readme.slice(0, README_MAX_CHARS) : null,
  };

  const userPrompt = buildRepositoryReviewUserPrompt(repoData);

  let rawOutput = await callAi({
    systemPrompt: REPOSITORY_REVIEW_SYSTEM_PROMPT,
    userPrompt,
  });
  let result = tryParseAiResponse(rawOutput, repositoryReviewSchema);

  let attempt = 0;
  while (!result.success && attempt < MAX_RETRY) {
    attempt++;
    logger.warn(
      { username, repoName, attempt, error: result.error },
      "AI response gagal validasi, mencoba ulang",
    );

    const retryPrompt = buildRetryPrompt(rawOutput, result.error);
    rawOutput = await callAi({
      systemPrompt: REPOSITORY_REVIEW_SYSTEM_PROMPT,
      userPrompt: retryPrompt,
    });
    result = tryParseAiResponse(rawOutput, repositoryReviewSchema);
  }

  if (!result.success) {
    throw new AiResponseInvalidError();
  }

  return result.data;
}
