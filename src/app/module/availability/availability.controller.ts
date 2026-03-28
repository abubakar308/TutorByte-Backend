import status from "http-status";
import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { availabilityService } from "./availability.service";
import { IRequestUser } from "../auth/auth.interface";

// ─────────────────────────────────────────────────────────────
//  SET (full replace all slots)
// ─────────────────────────────────────────────────────────────

const setAvailability = catchAsync(async (req: Request, res: Response) => {
  const result = await availabilityService.setAvailability(
    req.user as IRequestUser,
    req.body
  );

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Availability set successfully.",
    data: result,
  });
});

// ─────────────────────────────────────────────────────────────
//  ADD a single slot
// ─────────────────────────────────────────────────────────────

const addSlot = catchAsync(async (req: Request, res: Response) => {
  const result = await availabilityService.addSlot(
    req.user as IRequestUser,
    req.body
  );

  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: "Availability slot added successfully.",
    data: result,
  });
});

// ─────────────────────────────────────────────────────────────
//  UPDATE a single slot
// ─────────────────────────────────────────────────────────────

const updateSlot = catchAsync(async (req: Request, res: Response) => {
  const result = await availabilityService.updateSlot(
    req.user as IRequestUser,
    req.params.slotId as string,
    req.body
  );

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Availability slot updated successfully.",
    data: result,
  });
});

// ─────────────────────────────────────────────────────────────
//  DELETE a single slot
// ─────────────────────────────────────────────────────────────

const deleteSlot = catchAsync(async (req: Request, res: Response) => {
  const result = await availabilityService.deleteSlot(
    req.user as IRequestUser,
    req.params.slotId as string
  );

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

// ─────────────────────────────────────────────────────────────
//  TOGGLE active/inactive
// ─────────────────────────────────────────────────────────────

const toggleSlot = catchAsync(async (req: Request, res: Response) => {
  const result = await availabilityService.toggleSlot(
    req.user as IRequestUser,
    req.params.slotId as string
  );

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: `Slot ${result.isActive ? "activated" : "deactivated"} successfully.`,
    data: result,
  });
});

// ─────────────────────────────────────────────────────────────
//  GET MY availability (tutor — all slots)
// ─────────────────────────────────────────────────────────────

const getMyAvailability = catchAsync(async (req: Request, res: Response) => {
  const result = await availabilityService.getMyAvailability(
    req.user as IRequestUser
  );

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Availability fetched successfully.",
    data: result,
  });
});

// ─────────────────────────────────────────────────────────────
//  GET PUBLIC availability (student / anyone)
// ─────────────────────────────────────────────────────────────

const getPublicAvailability = catchAsync(async (req: Request, res: Response) => {
  const result = await availabilityService.getPublicAvailability(
    req.params.tutorId as string
  );

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Tutor availability fetched successfully.",
    data: result,
  });
});

// ─────────────────────────────────────────────────────────────
//  CHECK if a specific slot is free
// ─────────────────────────────────────────────────────────────

const checkAvailability = catchAsync(async (req: Request, res: Response) => {
  const result = await availabilityService.checkAvailability({
    tutorId: req.params.tutorId as string,
    bookingDate: req.query.bookingDate as string,
    startTime: req.query.startTime as string,
    endTime: req.query.endTime as string,
  });

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: result.available
      ? "Slot is available."
      : "Slot is not available.",
    data: result,
  });
});

export const availabilityController = {
  setAvailability,
  addSlot,
  updateSlot,
  deleteSlot,
  toggleSlot,
  getMyAvailability,
  getPublicAvailability,
  checkAvailability,
};