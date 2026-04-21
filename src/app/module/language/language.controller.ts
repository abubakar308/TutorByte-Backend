import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { LanguageService } from "./language.service";

const createLanguage = catchAsync(async (req: Request, res: Response) => {
  const result = await LanguageService.createLanguage(req.body);
  sendResponse(res, {
    httpStatusCode: httpStatus.CREATED,
    success: true,
    message: "Language created successfully",
    data: result,
  });
});

const getAllLanguages = catchAsync(async (req: Request, res: Response) => {
  const result = await LanguageService.getAllLanguages();
  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "Languages fetched successfully",
    data: result,
  });
});

const getLanguageById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await LanguageService.getLanguageById(id);
  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "Language fetched successfully",
    data: result,
  });
});

const updateLanguage = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await LanguageService.updateLanguage(id, req.body);
  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "Language updated successfully",
    data: result,
  });
});

const deleteLanguage = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const result = await LanguageService.deleteLanguage(id);
  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "Language deleted successfully",
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
  const result = await LanguageService.uploadIcon(req.params.id, req.file.buffer);
  sendResponse(res, {
    httpStatusCode: httpStatus.OK,
    success: true,
    message: "Language icon uploaded successfully",
    data: result,
  });
});

export const LanguageController = {
  createLanguage,
  getAllLanguages,
  getLanguageById,
  updateLanguage,
  deleteLanguage,
  uploadIcon,
};

