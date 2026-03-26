import { Router } from "express";
import { AuthController } from "./auth.controller";

const router = Router();

router.post("/register", AuthController.registerStudent);
router.post("/login", AuthController.loginStudent);

export const AuthRoutes = router;
