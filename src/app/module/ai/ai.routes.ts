import express from "express";
import { getSuggestions, getRecommendations } from "./ai.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { UserRole } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateRequest";
import { recommendationValidation } from "./ai.validation";


const router = express.Router();

router.get("/suggestions", getSuggestions);

// protected route
router.get("/recommendations",
    checkAuth(),
    // validateRequest(recommendationValidation),
    getRecommendations);

export const AIRoutes = router;