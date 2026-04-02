
import express from "express";
import { UserController } from "./student.controller";
import { auth } from "../../lib/auth";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { UserValidation } from "./student.validation";
import { UserRole } from "../../../generated/prisma/enums";


const router = express.Router();
router.get(
  "/student-stats",
  checkAuth(UserRole.STUDENT),
  UserController.getStudentStats
);

// প্রোফাইল আপডেট করার রুট
router.patch(
  "/update-profile",
  checkAuth(UserRole.STUDENT, UserRole.TUTOR, UserRole.ADMIN),
  validateRequest(UserValidation.updateProfileZodSchema),
  UserController.updateProfile
);

export const UserRoutes = router;