import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { AdminService } from "./admin.service";

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getAllUsers(req.query);
  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "Users fetched successfully",
    data: result,
  });
});

const updateUserStatus = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { status } = req.body;
  const adminId = (req as any).user.userId;
  
  const result = await AdminService.updateUserStatus(id, status, adminId);
  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "User status updated successfully",
    data: result,
  });
});

const updateUserRole = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { role } = req.body;
  const adminId = (req as any).user.userId;
  
  const result = await AdminService.updateUserRole(id, role, adminId);
  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "User role updated successfully",
    data: result,
  });
});

const getDashboardStats = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getDashboardStats();
  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "Dashboard statistics fetched successfully",
    data: result,
  });
});

const getAdminLogs = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getAdminLogs();
  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "Admin logs fetched successfully",
    data: result,
  });
});

const createAdmin = catchAsync(async (req: Request, res: Response) => {
  const adminId = (req as any).user.userId;
  const result = await AdminService.createAdmin(req.body, adminId);
  sendResponse(res, {
    httpStatusCode: httpStatus.CREATED,
    success: true,
    message: "Admin created successfully",
    data: result,
  });
});

const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const adminId = (req as any).user.userId;
  const result = await AdminService.deleteUser(id, adminId);
  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "User deleted successfully",
    data: result,
  });
});

export const AdminController = {
  getAllUsers,
  updateUserStatus,
  updateUserRole,
  getDashboardStats,
  getAdminLogs,
  createAdmin,
  deleteUser,
};
