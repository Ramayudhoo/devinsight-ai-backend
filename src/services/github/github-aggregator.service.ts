import { getGithubProfile } from "./github-profile.service";
import {
  getGithubRepositories,
  calculateLanguageBreakdown,
  pickMostStarred,
  pickMostRecent,
  getRepositoryReadme,
} from "./github-repository.service";
import type { GithubUser, GithubRepo } from "@/schemas/github.schema";
import { cacheService, CACHE_TTL } from "../cache/cache.service";
import { logger } from "@/utils/logger";

/**
 * Bentuk data ringkas repo yang siap dikirim ke AI - field yang tidak
 * relevan (html_url, created_at, dll) sengaja tidak dimasukkan di sini
 * untuk hemat token. Ini BEDA dengan GithubRepo penuh yang dipakai
 * secara internal.
 */
export interface RepoSummary {
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  lastUpdated: string;
}

export interface DeveloperContext {
  profile: {
    username: string;
    name: string | null;
    bio: string | null;
    company: string | null;
    location: string | null;
    publicRepos: number;
    followers: number;
    accountAgeMonths: number;
  };
  languages: Record<string, number>;
  repositories: RepoSummary[];
  mostStarred: RepoSummary | null;
  mostRecent: RepoSummary | null;
  readmeExcerpt: string | null;
}

function toRepoSummary(repo: GithubRepo): RepoSummary {
  return {
    name: repo.name,
    description: repo.description,
    language: repo.language,
    stars: repo.stargazers_count,
    forks: repo.forks_count,
    lastUpdated: repo.pushed_at,
  };
}

function calculateAccountAgeMonths(createdAt: string): number {
  const created = new Date(createdAt);
  const now = new Date();
  return Math.max(
    0,
    (now.getFullYear() - created.getFullYear()) * 12 +
      (now.getMonth() - created.getMonth()),
  );
}

/**
 * Batas jumlah repo yang dikirim ke AI. Kalau user punya repo lebih dari
 * ini, ambil yang paling relevan (terbaru & terpopuler) - bukan asal
 * potong urutan, supaya tidak kehilangan sinyal penting.
 */
const MAX_REPOS_FOR_AI = 15;
const README_MAX_CHARS = 2000;

export async function buildDeveloperContext(
  username: string,
): Promise<DeveloperContext> {
  const { value, cached } = await cacheService.getOrSet<DeveloperContext>(
    `github-context:${username}`,
    CACHE_TTL.GITHUB_DATA_MS,
    () => fetchDeveloperContext(username),
  );

  if (cached) {
    logger.info(`Cache hit: github-context:${username}`);
  }
  return value;
}

// Function asli yang isinya fetch GitHub API, dipanggil hanya saat cache MISS
async function fetchDeveloperContext(
  username: string,
): Promise<DeveloperContext> {
  // Langkah 1: profile & repositories bisa diambil PARALEL (tidak saling bergantung)
  const [profile, repos] = await Promise.all([
    getGithubProfile(username),
    getGithubRepositories(username),
  ]);

  const mostStarredRepo = pickMostStarred(repos);
  const mostRecentRepo = pickMostRecent(repos);

  // Langkah 2: README baru bisa diambil SETELAH tau repo mana yang paling relevan
  const readmeTarget = mostStarredRepo ?? mostRecentRepo;
  const readme = readmeTarget
    ? await getRepositoryReadme(username, readmeTarget.name)
    : null;

  // Pilih repo yang dikirim ke AI: gabungan terpopuler & terbaru, dedup, dibatasi jumlahnya
  const relevantRepos = selectRelevantRepos(repos, MAX_REPOS_FOR_AI);

  return {
    profile: {
      username: profile.login,
      name: profile.name,
      bio: profile.bio,
      company: profile.company,
      location: profile.location,
      publicRepos: profile.public_repos,
      followers: profile.followers,
      accountAgeMonths: calculateAccountAgeMonths(profile.created_at),
    },
    languages: calculateLanguageBreakdown(repos),
    repositories: relevantRepos.map(toRepoSummary),
    mostStarred: mostStarredRepo ? toRepoSummary(mostStarredRepo) : null,
    mostRecent: mostRecentRepo ? toRepoSummary(mostRecentRepo) : null,
    readmeExcerpt: readme ? readme.slice(0, README_MAX_CHARS) : null,
  };
}
function selectRelevantRepos(repos: GithubRepo[], limit: number): GithubRepo[] {
  const byStars = [...repos].sort(
    (a, b) => b.stargazers_count - a.stargazers_count,
  );
  const byRecent = [...repos].sort(
    (a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime(),
  );

  const seen = new Set<string>();
  const result: GithubRepo[] = [];

  // Selang-seling ambil dari yang terpopuler & terbaru, biar representatif dua-duanya
  for (
    let i = 0;
    i < Math.max(byStars.length, byRecent.length) && result.length < limit;
    i++
  ) {
    for (const candidate of [byStars[i], byRecent[i]]) {
      if (candidate && !seen.has(candidate.name) && result.length < limit) {
        seen.add(candidate.name);
        result.push(candidate);
      }
    }
  }

  return result;
}
