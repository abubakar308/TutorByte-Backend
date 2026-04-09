import { z } from "zod";

export const searchSuggestionValidation = z.object({
  query: z
    .string({
      message: "Search query is required",
    })
    .min(1, "Search query cannot be empty")
    .max(50, "Search query too long"),
});

export const recommendationValidation = z.object({
  userId: z.string().uuid("Invalid user ID"),
});