import type { Context } from "hono";
import { repositoryReviewRequestSchema } from "@/schemas/repository-review.schema";
import { reviewRepository } from "@/services/ai/repository-review.service";
import { ok } from "@/utils/response";
import { ValidationError } from "@/utils/errors";

export async function repositoryReviewHandler(c: Context) {
  const body = await c.req.json().catch(() => null);
  const parsed = repositoryReviewRequestSchema.safeParse(body);

  if (!parsed.success) {
    throw new ValidationError(
      parsed.error.issues[0]?.message ?? "Body request tidak valid",
    );
  }

  const { data, cached } = await reviewRepository(
    parsed.data.username,
    parsed.data.repo,
  );
  return ok(c, data, { cached, generatedAt: new Date().toISOString() });
}
