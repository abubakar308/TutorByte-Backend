
import express from "express";
import { UserController } from "./student.controller";
import { auth } from "../../lib/auth";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { UserValidation } from "./student.validation";
import { UserRole } from "../../../generated/prisma/enums";
import { fileUpload } from "../../middleware/fileUpload";


const router = express.Router();

router.post(
  "/upload-avatar",
  checkAuth(UserRole.STUDENT, UserRole.TUTOR, UserRole.ADMIN),
  fileUpload.single("avatar"),
  UserController.uploadAvatar
);

router.get(
  "/student-stats",

  checkAuth(UserRole.STUDENT),
  UserController.getStudentStats
);


router.patch(
  "/update-profile",
  checkAuth(UserRole.STUDENT, UserRole.TUTOR, UserRole.ADMIN),
  validateRequest(UserValidation.updateProfileZodSchema),
  UserController.updateProfile
);

export const UserRoutes = router;