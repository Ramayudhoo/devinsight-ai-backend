import type { Context } from "hono";
import { usernameParamSchema } from "@/schemas/params.schema";
import { getGithubProfile } from "@/services/github/github-profile.service";
import {
  getGithubRepositories,
  calculateLanguageBreakdown,
} from "@/services/github/github-repository.service";
import { ok, fail } from "@/utils/response";
import { ValidationError } from "@/utils/errors";

export async function getProfileHandler(c: Context) {
  const parsed = usernameParamSchema.safeParse({
    username: c.req.param("username"),
  });
  if (!parsed.success) {
    throw new ValidationError(
      parsed.error.issues[0]?.message ?? "Parameter tidak valid",
    );
  }

  const profile = await getGithubProfile(parsed.data.username);
  return ok(c, profile);
}

export async function getRepositoriesHandler(c: Context) {
  const parsed = usernameParamSchema.safeParse({
    username: c.req.param("username"),
  });
  if (!parsed.success) {
    throw new ValidationError(
      parsed.error.issues[0]?.message ?? "Parameter tidak valid",
    );
  }

  const repos = await getGithubRepositories(parsed.data.username);
  return ok(c, repos, { count: repos.length });
}

export async function getLanguagesHandler(c: Context) {
  const parsed = usernameParamSchema.safeParse({
    username: c.req.param("username"),
  });
  if (!parsed.success) {
    throw new ValidationError(
      parsed.error.issues[0]?.message ?? "Parameter tidak valid",
    );
  }

  const repos = await getGithubRepositories(parsed.data.username);
  const languages = calculateLanguageBreakdown(repos);
  return ok(c, languages);
}
