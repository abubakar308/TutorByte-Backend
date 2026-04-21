import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { SubjectService } from "./subject.service";

const createSubject = catchAsync(async (req: Request, res: Response) => {
  const result = await SubjectService.createSubject(req.body);
  sendResponse(res, {
    httpStatusCode: httpStatus.CREATED,
    success: true,
    message: "Subject created successfully",
    data: result,
  });
});

const getAllSubjects = catchAsync(async (req: Request, res: Response) => {
  const result = await SubjectService.getAllSubjects();
  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "Subjects fetched successfully",
    data: result,
  });
});

const getSubjectById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await SubjectService.getSubjectById(id);
  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "Subject fetched successfully",
    data: result,
  });
});

const deleteSubject = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await SubjectService.deleteSubject(id);
  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "Subject deleted successfully",
    data: result,
  });
});

const uploadIcon = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "No file uploaded. Field name must be 'icon'.",
    });
    return;
  }
  const result = await SubjectService.uploadIcon(req.params.id as string, req.file.buffer);
  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "Subject icon uploaded successfully",
    data: result,
  });
});

export const SubjectController = {
  createSubject,
  getAllSubjects,
  getSubjectById,
  deleteSubject,
  uploadIcon,
};

