import { Request, Response } from "express";
import { AIService } from "./ai.service";
import { catchAsync } from "../../shared/catchAsync";

export const getSuggestions = catchAsync(async (req: Request, res: Response) => {
  const query = req.query.query as string;

  if (!query) {
    return res.status(400).json({
      success: false,
      message: "Query is required",
    });
  }

  const data = await AIService.getSearchSuggestions(query);

  res.status(200).json({
    success: true,
    message: "Suggestions fetched successfully",
    data,
  });
});

export const getRecommendations = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  const data = await AIService.getRecommendedTutors(userId);

  res.status(200).json({
    success: true,
    message: "Recommended tutors fetched successfully",
    data,
  });
});