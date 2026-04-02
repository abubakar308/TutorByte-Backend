import { z } from "zod";
import { SubjectCategory } from "../../../generated/prisma/enums";

const createSubjectValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    category: z.enum(SubjectCategory, {
      message: "Category is required",
    }),
  }),
});

export const SubjectValidation = {
  createSubjectValidationSchema
};
