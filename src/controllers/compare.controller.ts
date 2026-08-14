import type { Context } from "hono";
import { compareRequestSchema } from "@/schemas/compare.schema";
import { compareGithubProfiles } from "@/services/ai/compare.service";
import { ok } from "@/utils/response";
import { ValidationError } from "@/utils/errors";

export async function compareHandler(c: Context) {
  const body = await c.req.json().catch(() => null);
  const parsed = compareRequestSchema.safeParse(body);

  if (!parsed.success) {
    throw new ValidationError(
      parsed.error.issues[0]?.message ?? "Body request tidak valid",
    );
  }

  const { data, cached } = await compareGithubProfiles(
    parsed.data.usernameA,
    parsed.data.usernameB,
  );
  return ok(c, data, { cached, generatedAt: new Date().toISOString() });
}
