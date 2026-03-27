import { Router } from "express";
import { AuthRoutes } from "../module/auth/auth.route";
import { TutorRoutes } from "../module/tutor/tutor.route";


const router = Router();

router.use("/auth", AuthRoutes);
router.use("/tutors", TutorRoutes);

export const IndexRoutes = router;