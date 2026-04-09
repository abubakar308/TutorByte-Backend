import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { AdminController } from "./admin.controller";
import { AdminValidation } from "./admin.validation";

const router = Router();

// Dashboard
router.get(
  "/dashboard-stats",
  AdminController.getDashboardStats
);

router.get(
  "/logs",
  checkAuth(UserRole.ADMIN),
  AdminController.getAdminLogs
);

router.post(
  "/create-admin",
  checkAuth(UserRole.ADMIN),
  validateRequest(AdminValidation.createAdminValidationSchema),
  AdminController.createAdmin
);

// User Management
router.get(
  "/users",
  checkAuth(UserRole.ADMIN),
  AdminController.getAllUsers
);

router.patch(
  "/users/:id/status",
  checkAuth(UserRole.ADMIN),
  validateRequest(AdminValidation.updateUserStatusValidationSchema),
  AdminController.updateUserStatus
);

router.patch(
  "/users/:id/role",
  checkAuth(UserRole.ADMIN),
  validateRequest(AdminValidation.updateUserRoleValidationSchema),
  AdminController.updateUserRole
);

// Tutor Management
router.patch(
  "/tutors/:id/approve",
  checkAuth(UserRole.ADMIN),
  validateRequest(AdminValidation.approveTutorValidationSchema),
  AdminController.approveTutor
);

router.patch(
  "/tutors/:id/reject",
  checkAuth(UserRole.ADMIN),
  validateRequest(AdminValidation.rejectTutorValidationSchema),
  AdminController.rejectTutor
);

router.delete(
  "/users/:id",
  checkAuth(UserRole.ADMIN),
  AdminController.deleteUser
);

export const AdminRoutes = router;
