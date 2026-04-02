import status from "http-status";
import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { availabilityService } from "./availability.service";
import { IRequestUser } from "../auth/auth.interface";

// ─────────────────────────────────────────────────────────────
//  SET (সব স্লট একসাথে রিপ্লেস বা সেট করার জন্য)
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
//  UPDATE (নির্দিষ্ট স্লট আপডেট বা অ্যাক্টিভ/ইনঅ্যাক্টিভ করার জন্য)
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
//  DELETE (স্লট মুছে ফেলার জন্য)
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
//  GET MY AVAILABILITY (টিউটরের নিজের ড্যাশবোর্ডের জন্য)
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
//  GET PUBLIC AVAILABILITY (স্টুডেন্ট যখন টিউটরের প্রোফাইল দেখবে)
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
//  CHECK (বুকিং করার আগে নির্দিষ্ট সময় ফ্রি আছে কি না চেক)
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
  updateSlot,
  deleteSlot,
  getMyAvailability,
  getPublicAvailability,
  checkAvailability,
};