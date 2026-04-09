import { Router } from "express";
import { AuthRoutes } from "../module/auth/auth.route";
import { TutorRoutes } from "../module/tutor/tutor.route";
import { BookingRoute } from "../module/booking/booking.route";
import { AdminRoutes } from "../module/admin/admin.route";
import { SubjectRoutes } from "../module/subject/subject.route";
import { LanguageRoutes } from "../module/language/language.route";
import { AvailabilityRoutes } from "../module/availability/availability.route";
import { PaymentRoutes } from "../module/payment/payment.route";
import { UserRoutes } from "../module/student/student.route";
import { AIRoutes } from "../module/ai/ai.routes";
import { reviewRoutes } from "../module/review/reviews.route";


const router = Router();

router.use("/auth", AuthRoutes);
router.use("/tutors", TutorRoutes);
router.use("/users", UserRoutes); 
router.use("/bookings", BookingRoute);
router.use("/reviews", reviewRoutes);
router.use("/admin", AdminRoutes);
router.use("/subject", SubjectRoutes);
router.use("/language", LanguageRoutes);
router.use("/availability", AvailabilityRoutes);
router.use("/payments", PaymentRoutes);
router.use("/ai", AIRoutes);

export const IndexRoutes = router;