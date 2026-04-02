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


const getAllTutors = catchAsync(async (req: Request, res: Response) => {

  const result = await TutorServices.getAllTutors(req.query);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Tutors fetched successfully.",
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
//  DASHBOARD
// ─────────────────────────────────────────────────────────────

const getDashboardStats = catchAsync(async (req: Request, res: Response) => {

  const user = req.user as IRequestUser;
  const result = await TutorServices.getDashboardStats(user.userId);

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
  getAllTutors,
  getPublicProfile,
  uploadAvatar,
  getDashboardStats,
};