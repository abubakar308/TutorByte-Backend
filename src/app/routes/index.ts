import { Router } from "express";
import { AuthRoutes } from "../module/auth/auth.route";
import { TutorRoutes } from "../module/tutor/tutor.route";
import { BookingRoute } from "../module/booking/booking.route";
import { AdminRoutes } from "../module/admin/admin.route";
import { SubjectRoutes } from "../module/subject/subject.route";
import { LanguageRoutes } from "../module/language/language.route";
import { AvailabilityRoutes } from "../module/availability/availability.route";


const router = Router();

router.use("/auth", AuthRoutes);
router.use("/tutors", TutorRoutes);
router.use("/bookings", BookingRoute);
router.use("/admin", AdminRoutes);
router.use("/subject", SubjectRoutes);
router.use("/language", LanguageRoutes);
router.use("/availability", AvailabilityRoutes);

export const IndexRoutes = router;