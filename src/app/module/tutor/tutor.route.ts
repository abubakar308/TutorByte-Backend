import { Router } from "express";
import { TutorController } from "./tutor.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { TutorValidation } from "./tutor.validation";

import { UserRole } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateRequest";

const router = Router();

// ── Public routes (no auth needed) ────────────────────────────

/**
 * GET /tutors/search
 * Query: subject, language, minPrice, maxPrice, minRating,
 *        search, sortBy, page, limit
 */

router.get(
  "/search",
  // validateRequest(TutorValidation.searchQuerySchema),
  TutorController.searchTutors
);

/**
 * GET /tutors/:tutorId/profile
 * Public profile — only approved tutors are visible
 */
router.get("/:tutorId/profile", TutorController.getPublicProfile);

// ── Tutor-only protected routes ────────────────────────────────

/**
 * POST /tutors/profile
 * Create tutor profile (one-time setup after registration)
 */
router.post(
  "/profile",
  checkAuth(UserRole.STUDENT, UserRole.TUTOR),
  validateRequest(TutorValidation.createProfileSchema),
  TutorController.createTutorProfile
);

/**
 * PATCH /tutors/profile
 * Update tutor profile fields
 */

router.patch(
  "/profile",
  checkAuth(UserRole.TUTOR),
  validateRequest(TutorValidation.updateProfileSchema),
  TutorController.updateTutorProfile
);

/**
 * GET /tutors/profile/me
 * Tutor's own full profile (with availability, reviews, counts)
 */
router.get(
  "/profile/me",
  checkAuth(UserRole.TUTOR),
  TutorController.getMyProfile
);

/**
 * GET /tutors/dashboard/stats
 * Earnings, booking counts, upcoming sessions, recent reviews
 */
router.get(
  "/dashboard/stats",
  checkAuth(UserRole.TUTOR),
  TutorController.getDashboardStats
);

// ── Availability ───────────────────────────────────────────────

/**
 * PUT /tutors/availability
 * Full-replace availability slots (send all slots at once)
 * Body: { slots: [{ dayOfWeek, startTime, endTime, isRecurring? }] }
 */
router.put(
  "/availability",
  checkAuth(UserRole.TUTOR),
  validateRequest(TutorValidation.setAvailabilitySchema),
  TutorController.setAvailability
);

/**
 * GET /tutors/availability/me
 * Returns slots grouped by day of week
 */
router.get(
  "/availability/me",
  checkAuth(UserRole.TUTOR),
  TutorController.getMyAvailability
);

// ── Uploads ────────────────────────────────────────────────────

/**
 * POST /tutors/upload/avatar
 * multipart/form-data  field: "avatar"  (image, max 5MB)
 */
router.post(
  "/upload/avatar",
  checkAuth(UserRole.TUTOR, UserRole.STUDENT),  // both roles can upload avatars

  TutorController.uploadAvatar
);



export const TutorRoutes = router;