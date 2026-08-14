import { env } from "@/config/env";
import { GithubApiError, GithubUserNotFoundError } from "@/utils/errors";

const GITHUB_API_BASE = "https://api.github.com";

/**
 * Wrapper HTTP murni ke GitHub REST API.
 * Tidak ada business logic di sini - cuma tanggung jawab komunikasi HTTP:
 * set header, handle status code, timeout, dan translate error jadi AppError.
 * Kalau nanti mau ganti dari fetch ke axios, atau GitHub API-nya ganti versi,
 * cukup ubah file ini saja, tidak perlu sentuh service layer.
 */ async function githubFetch<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(`${GITHUB_API_BASE}${path}`, {
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      signal: controller.signal,
    });

    if (response.status === 404) {
      if (path.includes("/repos/")) {
        throw new GithubApiError(`Repository tidak ditemukan: ${path}`);
      }
      const username = path.split("/").pop() ?? "unknown";
      throw new GithubUserNotFoundError(username);
    }

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new GithubApiError(
        `GitHub API merespons status ${response.status} untuk ${path}: ${body.slice(0, 200)}`,
      );
    }

    return (await response.json()) as T;
  } catch (err) {
    if (
      err instanceof GithubUserNotFoundError ||
      err instanceof GithubApiError
    ) {
      throw err;
    }
    if (err instanceof Error && err.name === "AbortError") {
      throw new GithubApiError(`Timeout saat menghubungi GitHub API: ${path}`);
    }
    throw new GithubApiError(
      `Gagal menghubungi GitHub API: ${(err as Error).message}`,
    );
  } finally {
    clearTimeout(timeout);
  }
}

export const githubProvider = {
  getUser: (username: string) => githubFetch<unknown>(`/users/${username}`),

  getRepositories: (username: string) =>
    githubFetch<unknown>(`/users/${username}/repos?per_page=100&sort=updated`),

  getSingleRepo: (owner: string, repo: string) =>
    githubFetch<unknown>(`/repos/${owner}/${repo}`),

  getReadme: (owner: string, repo: string) =>
    githubFetch<unknown>(`/repos/${owner}/${repo}/readme`),
};
