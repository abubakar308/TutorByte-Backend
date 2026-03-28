import { Router } from "express";
import { availabilityController } from "./availability.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { AvailabilityValidation } from "./availability.validation";
import { UserRole } from "../../../generated/prisma/enums";

const router = Router();

// ─────────────────────────────────────────────────────────────
//  PUBLIC  (no auth)
// ─────────────────────────────────────────────────────────────

/**
 * GET /availability/:tutorId
 * Public — returns only isActive=true slots, grouped by day
 * Used by student when viewing a tutor's profile to see when they're free
 */
router.get(
  "/:tutorId",
  availabilityController.getPublicAvailability
);

/**
 * GET /availability/:tutorId/check
 * Public — check if a specific date+time slot is bookable
 * Query: bookingDate, startTime, endTime
 *
 * Example:
 * GET /availability/abc-123/check?bookingDate=2025-08-10&startTime=10:00&endTime=11:00
 */
router.get(
  "/:tutorId/check",
  validateRequest(AvailabilityValidation.checkAvailabilitySchema),
  availabilityController.checkAvailability
);

// ─────────────────────────────────────────────────────────────
//  TUTOR-ONLY  (protected)
// ─────────────────────────────────────────────────────────────

/**
 * GET /availability/me
 * Tutor's own full availability — all slots (active + inactive), grouped by day
 */
router.get(
  "/me",
  checkAuth(UserRole.TUTOR),
  availabilityController.getMyAvailability
);

/**
 * PUT /availability
 * Full replace — send ALL slots at once, existing slots are wiped
 * Best for initial setup or bulk edits
 *
 * Body: { slots: [{ dayOfWeek, startTime, endTime, isActive }] }
 */
router.put(
  "/",
  checkAuth(UserRole.TUTOR),
  validateRequest(AvailabilityValidation.setAvailabilitySchema),
  availabilityController.setAvailability
);

/**
 * POST /availability/slot
 * Add a single new slot without touching others
 * Body: { dayOfWeek, startTime, endTime, isActive }
 */
router.post(
  "/slot",
  checkAuth(UserRole.TUTOR),
  validateRequest(AvailabilityValidation.addSlotSchema),
  availabilityController.addSlot
);

/**
 * PATCH /availability/slot/:slotId
 * Update one slot's times or active status
 * Body: { startTime?, endTime?, isActive? }
 */
router.patch(
  "/slot/:slotId",
  checkAuth(UserRole.TUTOR),
  validateRequest(AvailabilityValidation.updateSlotSchema),
  availabilityController.updateSlot
);

/**
 * PATCH /availability/slot/:slotId/toggle
 * Quick toggle isActive true ↔ false
 */
router.patch(
  "/slot/:slotId/toggle",
  checkAuth(UserRole.TUTOR),
  availabilityController.toggleSlot
);

/**
 * DELETE /availability/slot/:slotId
 * Remove a single slot permanently
 */
router.delete(
  "/slot/:slotId",
  checkAuth(UserRole.TUTOR),
  availabilityController.deleteSlot
);

export const AvailabilityRoutes = router;