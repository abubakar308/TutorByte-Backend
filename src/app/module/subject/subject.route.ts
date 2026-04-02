import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { SubjectController } from "./subject.controller";
import { SubjectValidation } from "./subject.validation";

const router = Router();

router.get("/", SubjectController.getAllSubjects);
router.get("/:id", SubjectController.getSubjectById);

router.post(
  "/",
  checkAuth(UserRole.ADMIN),
  validateRequest(SubjectValidation.createSubjectValidationSchema),
  SubjectController.createSubject
);

router.delete(
  "/:id",
  checkAuth(UserRole.ADMIN),
  SubjectController.deleteSubject
);

export const SubjectRoutes = router;
