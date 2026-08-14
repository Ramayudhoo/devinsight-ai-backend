import { githubProvider } from "@/providers/github.provider";
import { githubUserSchema, type GithubUser } from "@/schemas/github.schema";
import { GithubApiError } from "@/utils/errors";

/**
 * Ambil profil dasar GitHub user, sudah tervalidasi bentuknya.
 * Kalau response GitHub berubah struktur suatu saat (breaking change dari
 * pihak GitHub), Zod akan gagal parse dan kita tau lebih awal - bukan
 * error samar-samar di layer AI nanti.
 */
export async function getGithubProfile(username: string): Promise<GithubUser> {
  const raw = await githubProvider.getUser(username);
  const parsed = githubUserSchema.safeParse(raw);

  if (!parsed.success) {
    throw new GithubApiError(
      `Response GitHub API untuk user "${username}" tidak sesuai schema yang diharapkan`,
    );
  }

  return parsed.data;
}
