import { Router } from "express";
import { availabilityController } from "./availability.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { AvailabilityValidation } from "./availability.validation";
import { UserRole } from "../../../generated/prisma/enums";

const router = Router();

// ─────────────────────────────────────────────────────────────
//  ⚠️  ROUTE ORDER MATTERS IN EXPRESS
//  Static paths (/me, /slot, /slot/:id) MUST be declared
//  BEFORE dynamic paths (/:tutorId) — otherwise Express
//  matches "me" and "slot" as tutorId param values and
//  the static handlers are never reached.
// ─────────────────────────────────────────────────────────────

// ── TUTOR protected ───────────────────────────────────────────

router.get("/me", checkAuth(UserRole.TUTOR), availabilityController.getMyAvailability);

router.put(
  "/",
  checkAuth(UserRole.TUTOR),
  validateRequest(AvailabilityValidation.setAvailabilitySchema),
  availabilityController.setAvailability
);


router.patch(
  "/slot/:slotId",
  checkAuth(UserRole.TUTOR),
  validateRequest(AvailabilityValidation.updateSlotSchema),
  availabilityController.updateSlot
);

router.delete(
  "/slot/:slotId",
  checkAuth(UserRole.TUTOR),
  availabilityController.deleteSlot
);

// ── PUBLIC — dynamic params LAST ──────────────────────────────

router.get(
  "/:tutorId/check",               // more specific — before /:tutorId
  validateRequest(AvailabilityValidation.checkAvailabilitySchema),
  availabilityController.checkAvailability
);

router.get("/:tutorId", availabilityController.getPublicAvailability);

export const AvailabilityRoutes = router;