
import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { IRequestUser } from "../auth/auth.interface";
import e, { Request, Response } from "express";
import { reviewService } from "./reviews.service";




const createReview = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;

  const review = await reviewService.createReview(user.userId, req.body);

  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: "Review submitted successfully.",
    data: review,
  });
});

const getMyReviews = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const result = await reviewService.getMyReviews(user?.userId!);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "My reviews fetched successfully",
    data: result,
  });
});


const getAllReviews = catchAsync(async (req: Request, res: Response) => {
  const result = await reviewService.getAllReviews();
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "All reviews fetched successfully",
    data: result,
  });
});


export const reviewControllers = {
    createReview,
    getMyReviews,
    getAllReviews
};