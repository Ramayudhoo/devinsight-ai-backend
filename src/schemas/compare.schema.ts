import { z } from "zod";

export const compareRequestSchema = z
  .object({
    usernameA: z
      .string()
      .min(1)
      .max(39)
      .regex(/^[a-zA-Z0-9-]+$/, "Format username GitHub tidak valid"),
    usernameB: z
      .string()
      .min(1)
      .max(39)
      .regex(/^[a-zA-Z0-9-]+$/, "Format username GitHub tidak valid"),
  })
  .refine(
    (data) => data.usernameA.toLowerCase() !== data.usernameB.toLowerCase(),
    {
      message: "usernameA dan usernameB tidak boleh sama",
    },
  );
