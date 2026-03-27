import status from "http-status";
import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { TutorServices } from "./tutor.service";
import { IRequestUser } from "../auth/auth.interface";

// ─────────────────────────────────────────────────────────────
//  PROFILE
// ─────────────────────────────────────────────────────────────

const createTutorProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await TutorServices.createTutorProfile(
    req.user as IRequestUser,
    req.body
  );

  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: "Tutor profile created successfully. Pending admin approval.",
    data: result,
  });
});

const updateTutorProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await TutorServices.updateTutorProfile(
    req.user as IRequestUser,
    req.body
  );

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Tutor profile updated successfully.",
    data: result,
  });
});

const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const result = await TutorServices.getMyProfile(req.user as IRequestUser);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Tutor profile fetched successfully.",
    data: result,
  });
});

// ─────────────────────────────────────────────────────────────
//  PUBLIC PROFILE
// ─────────────────────────────────────────────────────────────

const getPublicProfile = catchAsync(async (req: Request, res: Response) => {
  const { tutorId } = req.params;
  const result = await TutorServices.getPublicProfile(tutorId as string);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Tutor profile fetched successfully.",
    data: result,
  });
});

// ─────────────────────────────────────────────────────────────
//  SEARCH
// ─────────────────────────────────────────────────────────────

const searchTutors = catchAsync(async (req: Request, res: Response) => {
  const query = {
    subject: req.query.subject as string | undefined,
    language: req.query.language as string | undefined,
    minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
    maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
    minRating: req.query.minRating ? Number(req.query.minRating) : undefined,
    search: req.query.search as string | undefined,
    sortBy: req.query.sortBy as "rating" | "price_asc" | "price_desc" | "reviews" | undefined,
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 10,
  };

  const result = await TutorServices.searchTutors(query);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Tutors fetched successfully.",
    data: result.tutors,
  });
});

// ─────────────────────────────────────────────────────────────
//  UPLOADS
// ─────────────────────────────────────────────────────────────

const uploadAvatar = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(status.BAD_REQUEST).json({
      success: false,
      message: "No file uploaded. Field name must be 'avatar'.",
    });
    return;
  }

  const result = await TutorServices.uploadAvatar(
    req.user as IRequestUser,
    req.file.buffer,
    req.file.mimetype
  );

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Avatar uploaded successfully.",
    data: result,
  });
});

// ─────────────────────────────────────────────────────────────
//  AVAILABILITY
// ─────────────────────────────────────────────────────────────

const setAvailability = catchAsync(async (req: Request, res: Response) => {
  const result = await TutorServices.setAvailability(
    req.user as IRequestUser,
    req.body
  );

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Availability updated successfully.",
    data: result,
  });
});

const getMyAvailability = catchAsync(async (req: Request, res: Response) => {
  const result = await TutorServices.getMyAvailability(req.user as IRequestUser);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Availability fetched successfully.",
    data: result,
  });
});

// ─────────────────────────────────────────────────────────────
//  DASHBOARD
// ─────────────────────────────────────────────────────────────

const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
  const result = await TutorServices.getDashboardStats(req.user as IRequestUser);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Dashboard stats fetched successfully.",
    data: result,
  });
});

// ─────────────────────────────────────────────────────────────
//  EXPORTS
// ─────────────────────────────────────────────────────────────

export const TutorController = {
  createTutorProfile,
  updateTutorProfile,
  getMyProfile,
  getPublicProfile,
  searchTutors,
  uploadAvatar,
  setAvailability,
  getMyAvailability,
  getDashboardStats,
};