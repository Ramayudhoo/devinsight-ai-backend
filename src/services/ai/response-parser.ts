import { z } from "zod";
import { AiResponseInvalidError } from "@/utils/errors";

function stripMarkdownFence(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

export function parseAiResponse<T>(rawText: string, schema: z.ZodType<T>): T {
  const cleaned = stripMarkdownFence(rawText);

  let json: unknown;
  try {
    json = JSON.parse(cleaned);
  } catch {
    throw new AiResponseInvalidError();
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new AiResponseInvalidError();
  }

  return parsed.data;
}

export function tryParseAiResponse<T>(
  rawText: string,
  schema: z.ZodType<T>,
): { success: true; data: T } | { success: false; error: string } {
  const cleaned = stripMarkdownFence(rawText);

  let json: unknown;
  try {
    json = JSON.parse(cleaned);
  } catch (err) {
    return {
      success: false,
      error: `JSON tidak valid: ${(err as Error).message}`,
    };
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues.map((i) => i.message).join(", "),
    };
  }

  return { success: true, data: parsed.data };
}
