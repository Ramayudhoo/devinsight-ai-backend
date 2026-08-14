import { z } from "zod";

export const analyzeRequestSchema = z.object({
  username: z
    .string()
    .min(1, "Username wajib diisi")
    .max(39, "Username GitHub maksimal 39 karakter")
    .regex(/^[a-zA-Z0-9-]+$/, "Format username GitHub tidak valid"),
});
