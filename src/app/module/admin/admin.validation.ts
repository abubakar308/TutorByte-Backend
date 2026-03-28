import { z } from "zod";
import { UserRole, UserStatus } from "../../../generated/prisma/enums";

const updateUserStatusValidationSchema = z.object({
  body: z.object({
    status: z.enum(UserStatus, {
      message: "Status is required",
    }),
  }),
});

const updateUserRoleValidationSchema = z.object({
  body: z.object({
    role: z.enum(UserRole, {
      message: "Role is required",
    }),
  }),
});

const createAdminValidationSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  }),
});

export const AdminValidation = {
  updateUserStatusValidationSchema,
  updateUserRoleValidationSchema,
  createAdminValidationSchema,
};
