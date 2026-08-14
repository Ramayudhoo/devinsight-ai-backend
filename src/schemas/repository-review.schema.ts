import { z } from "zod";

export const repositoryReviewRequestSchema = z.object({
  username: z
    .string()
    .min(1)
    .max(39)
    .regex(/^[a-zA-Z0-9-]+$/, "Format username GitHub tidak valid"),
  repo: z.string().min(1, "Nama repo wajib diisi").max(100),
});
