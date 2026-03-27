import { Router } from "express";
import { AuthController } from "./auth.controller";
import { checkAuth } from "../../middleware/checkAuth";

const router = Router();

router.post("/register", AuthController.registerStudent);
router.post("/login", AuthController.loginStudent);
router.get("/me", checkAuth(), AuthController.getMe);

export const AuthRoutes = router;
