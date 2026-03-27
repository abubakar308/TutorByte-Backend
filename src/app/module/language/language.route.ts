import { Router } from "express";
import { UserRole } from "../../../generated/prisma/enums";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { LanguageController } from "./language.controller";
import { LanguageValidation } from "./language.validation";

const router = Router();

router.get("/", LanguageController.getAllLanguages);
router.get("/:id", LanguageController.getLanguageById);

router.post(
  "/",
  // checkAuth(UserRole.ADMIN),
  // validateRequest(LanguageValidation.createLanguageValidationSchema),
  LanguageController.createLanguage
);

router.patch(
  "/:id",
  checkAuth(UserRole.ADMIN),
  validateRequest(LanguageValidation.updateLanguageValidationSchema),
  LanguageController.updateLanguage
);

router.delete(
  "/:id",
  checkAuth(UserRole.ADMIN),
  LanguageController.deleteLanguage
);

export const LanguageRoutes = router;
