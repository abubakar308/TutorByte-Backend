import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import status from "http-status";
import { UserService } from "./student.service";
const getStudentStats = catchAsync(async (req: Request, res: Response) => {
    const user = req.user

    console.log(user)
 
  const result = await UserService.getStudentDashboardStatsFromDB(user?.userId!);
  
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Student stats fetched successfully.",
    data: result
  });
});

const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;
  const result = await UserService.updateProfileInDB(user.id, req.body);
  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Profile updated successfully.",
    data: result
  });
});

const uploadAvatar = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(status.BAD_REQUEST).json({
      success: false,
      message: "No file uploaded. Field name must be 'avatar'.",
    });
    return;
  }

  const result = await UserService.uploadAvatar(
    req.user as any,
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

export const UserController = {
  getStudentStats,
  updateProfile,
  uploadAvatar,
};