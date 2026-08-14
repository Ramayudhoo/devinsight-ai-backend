import { z } from "zod";

/**
 * Schema untuk response GET /users/:username
 * Hanya field yang kita BUTUHKAN yang didefinisikan di sini.
 * Field seperti followers_url, gists_url, dll sengaja TIDAK dimasukkan -
 * kalau tidak ada di schema, otomatis "hilang" saat divalidasi (Zod strip
 * field yang tidak didefinisikan secara default). Ini sekaligus jadi
 * mekanisme filter data yang tidak relevan sejak awal.
 */
export const githubUserSchema = z.object({
  login: z.string(),
  name: z.string().nullable(),
  bio: z.string().nullable(),
  company: z.string().nullable(),
  location: z.string().nullable(),
  blog: z.string().nullable(),
  avatar_url: z.string().url(),
  public_repos: z.number(),
  public_gists: z.number(),
  followers: z.number(),
  following: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type GithubUser = z.infer<typeof githubUserSchema>;

/**
 * Schema untuk 1 item di response GET /users/:username/repos
 */
export const githubRepoSchema = z.object({
  name: z.string(),
  full_name: z.string(),
  description: z.string().nullable(),
  html_url: z.string().url(),
  language: z.string().nullable(),
  stargazers_count: z.number(),
  forks_count: z.number(),
  fork: z.boolean(), // penting: buat filter repo hasil fork, bukan karya asli
  archived: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  pushed_at: z.string(),
});

export type GithubRepo = z.infer<typeof githubRepoSchema>;

export const githubRepositoriesSchema = z.array(githubRepoSchema);

/**
 * Schema untuk GET /repos/:owner/:repo/readme
 * GitHub balikin content dalam bentuk base64, harus di-decode di service layer.
 */
export const githubReadmeSchema = z.object({
  content: z.string(),
  encoding: z.literal("base64"),
});

export type GithubReadme = z.infer<typeof githubReadmeSchema>;
