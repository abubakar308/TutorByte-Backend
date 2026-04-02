import { z } from "zod";

const updateProfileZodSchema = z.object({
  body: z.object({
    name: z.string().min(3).optional(),
    image: z.string().url().optional(),
  }),
});

export const UserValidation = {
  updateProfileZodSchema,
};