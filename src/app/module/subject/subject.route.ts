import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { SubjectController } from "./subject.controller";
import { SubjectValidation } from "./subject.validation";
import { fileUpload } from "../../middleware/fileUpload";

const router = Router();

router.get("/", SubjectController.getAllSubjects);
router.get("/:id", SubjectController.getSubjectById);

router.post(
  "/",
  checkAuth(UserRole.ADMIN),
  validateRequest(SubjectValidation.createSubjectValidationSchema),
  SubjectController.createSubject
);

router.post(
  "/:id/upload-icon",
  checkAuth(UserRole.ADMIN),
  fileUpload.single("icon"),
  SubjectController.uploadIcon
);

router.delete(
  "/:id",
  checkAuth(UserRole.ADMIN),
  SubjectController.deleteSubject
);

export const SubjectRoutes = router;

