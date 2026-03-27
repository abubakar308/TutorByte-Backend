import { z } from "zod";
import { SubjectCategory } from "../../../generated/prisma/enums";

const createSubjectValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    categories: z.nativeEnum(SubjectCategory, {
      message: "Category is required",
    }),
  }),
});

const updateSubjectValidationSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    categories: z.nativeEnum(SubjectCategory).optional(),
  }),
});

export const SubjectValidation = {
  createSubjectValidationSchema,
  updateSubjectValidationSchema,
};
