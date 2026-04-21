import express from "express";
import { getSuggestions, getRecommendations, generateChatReply, generateBio } from "./ai.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { UserRole } from "../../../generated/prisma/enums";
import { validateRequest } from "../../middleware/validateRequest";
import { recommendationValidation } from "./ai.validation";


const router = express.Router();

router.get("/suggestions", getSuggestions);

// protected route
router.get("/recommendations",
    // checkAuth(),
    // validateRequest(recommendationValidation),
    getRecommendations);



// ... existing code ...

router.post("/ai-chat", generateChatReply);
router.post("/generate-bio", checkAuth(UserRole.TUTOR, UserRole.STUDENT), generateBio);

export const AIRoutes = router;
