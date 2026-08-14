import { env } from "@/config/env";
import { AppError } from "@/utils/errors";

export class AiProviderError extends AppError {
  constructor(message: string) {
    super(502, "AI_PROVIDER_ERROR", message);
  }
}

interface ChatCompletionParams {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
}

/**
 * Wrapper HTTP murni ke AI API (OpenAI-compatible, dipakai lewat OpenRouter).
 * Sama seperti github.provider.ts - tidak ada business logic di sini,
 * cuma tanggung jawab komunikasi HTTP.
 */
export async function callAi({
  systemPrompt,
  userPrompt,
  temperature = 0.3,
}: ChatCompletionParams): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000); // AI bisa lambat, kasih 30 detik

  try {
    const response = await fetch(`${env.AI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.AI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: env.AI_MODEL,
        temperature,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new AiProviderError(
        `AI API merespons status ${response.status}: ${errBody.slice(0, 200)}`,
      );
    }

    const json = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };

    const content = json.choices?.[0]?.message?.content;
    if (!content) {
      throw new AiProviderError(
        "AI API tidak mengembalikan content pada response",
      );
    }

    return content;
  } catch (err) {
    if (err instanceof AiProviderError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new AiProviderError("Timeout saat menghubungi AI API");
    }
    throw new AiProviderError(
      `Gagal menghubungi AI API: ${(err as Error).message}`,
    );
  } finally {
    clearTimeout(timeout);
  }
}
