import { githubProvider } from "@/providers/github.provider";
import {
  githubRepositoriesSchema,
  githubReadmeSchema,
  githubRepoSchema,
  type GithubRepo,
} from "@/schemas/github.schema";
import { GithubApiError } from "@/utils/errors";

/**
 * Ambil semua repo milik user, sudah difilter dari fork & tervalidasi.
 * Filter fork di sini (bukan di aggregator) karena ini konsep yang
 * spesifik ke "apa itu repository milik user", jadi masuk akal ada
 * di service yang sama dengan pengambilan repo-nya.
 */
export async function getGithubRepositories(
  username: string,
): Promise<GithubRepo[]> {
  const raw = await githubProvider.getRepositories(username);
  const parsed = githubRepositoriesSchema.safeParse(raw);

  if (!parsed.success) {
    throw new GithubApiError(
      `Response repositories untuk "${username}" tidak sesuai schema`,
    );
  }

  // Exclude fork & repo yang di-archive - fokus ke karya aktif & orisinal
  return parsed.data.filter((repo) => !repo.fork && !repo.archived);
}

/**
 * Hitung breakdown bahasa pemrograman berdasarkan JUMLAH REPO per bahasa.
 * CATATAN: ini bukan breakdown "bytes of code" yang lebih akurat (itu
 * butuh panggil endpoint /repos/:owner/:repo/languages per repo, cukup
 * mahal secara rate limit). Untuk versi awal, pakai jumlah repo dulu -
 * cukup representatif dan jauh lebih murah dari sisi API call.
 */
export function calculateLanguageBreakdown(
  repos: GithubRepo[],
): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const repo of repos) {
    if (!repo.language) continue;
    counts[repo.language] = (counts[repo.language] ?? 0) + 1;
  }

  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  if (total === 0) return {};

  const percentages: Record<string, number> = {};
  for (const [lang, count] of Object.entries(counts)) {
    percentages[lang] = Math.round((count / total) * 1000) / 10; // 1 desimal
  }

  return percentages;
}

export function pickMostStarred(repos: GithubRepo[]): GithubRepo | null {
  if (repos.length === 0) return null;
  return (
    [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count)[0] ??
    null
  );
}

export function pickMostRecent(repos: GithubRepo[]): GithubRepo | null {
  if (repos.length === 0) return null;
  return (
    [...repos].sort(
      (a, b) =>
        new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime(),
    )[0] ?? null
  );
}

/**
 * Ambil & decode README repo tertentu. Return null kalau tidak ada
 * README (404) - ini kondisi normal, bukan error, jadi di-handle
 * dengan graceful fallback, bukan throw.
 */
export async function getRepositoryReadme(
  owner: string,
  repo: string,
): Promise<string | null> {
  try {
    const raw = await githubProvider.getReadme(owner, repo);
    const parsed = githubReadmeSchema.safeParse(raw);
    if (!parsed.success) return null;

    return Buffer.from(parsed.data.content, "base64").toString("utf-8");
  } catch {
    // README tidak ada itu wajar, bukan kegagalan sistem
    return null;
  }
}

export async function getSingleRepository(
  owner: string,
  repoName: string,
): Promise<GithubRepo> {
  const raw = await githubProvider.getSingleRepo(owner, repoName);
  const parsed = githubRepoSchema.safeParse(raw);

  if (!parsed.success) {
    throw new GithubApiError(
      `Response repo "${owner}/${repoName}" tidak sesuai schema`,
    );
  }

  return parsed.data;
}
