import { z } from "zod";

const createLanguageValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
  }),
});

const updateLanguageValidationSchema = z.object({
  body: z.object({
    name: z.string().optional(),
  }),
});

export const LanguageValidation = {
  createLanguageValidationSchema,
  updateLanguageValidationSchema,
};
