import status from "http-status";
import { Request, Response } from "express";
import { catchAsync } from "../../shared/catchAsync";
import { sendResponse } from "../../shared/sendResponse";
import { bookingService } from "./booking.service";
import { IRequestUser } from "../auth/auth.interface";

// ─────────────────────────────────────────────────────────────
//  BOOKING CONTROLLERS
// ─────────────────────────────────────────────────────────────

const createBooking = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;

  const booking = await bookingService.createBooking(user.userId, req.body);

  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: "Booking created successfully.",
    data: booking,
  });
});

const updateBooking = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;
  const bookingId = req.params.id;

  const booking = await bookingService.updateBookingStatus(
    user.userId,
    user.role,
    bookingId as string,
    req.body
  );

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Booking updated successfully.",
    data: booking,
  });
});

const getBookingById = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;

  const booking = await bookingService.getBookingById(
    user.userId,
    user.role,
    req.params.id as string
  );

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Booking fetched successfully.",
    data: booking,
  });
});

const getMyBookingsAsStudent = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;

  const result = await bookingService.getBookingsByStudent(user.userId, {
    status: req.query.status as any,
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 10,
  });

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Bookings fetched successfully.",
    data: result.bookings,
    meta: result.meta,
  });
});

const getMyBookingsAsTutor = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;

  const result = await bookingService.getBookingsByTutor(user.userId, {
    status: req.query.status as any,
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 10,
  });

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Bookings fetched successfully.",
    data: result.bookings,
    meta: result.meta,
  });
});

// ─────────────────────────────────────────────────────────────
//  REVIEW CONTROLLERS
// ─────────────────────────────────────────────────────────────

const createReview = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IRequestUser;

  const review = await bookingService.createReview(user.userId, req.body);

  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: "Review submitted successfully.",
    data: review,
  });
});

const getReviewsByTutor = catchAsync(async (req: Request, res: Response) => {
  const tutorId = req.params.tutorId;

  const result = await bookingService.getReviewsByTutor(tutorId as string, {
    page: req.query.page ? Number(req.query.page) : 1,
    limit: req.query.limit ? Number(req.query.limit) : 10,
  });

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: "Reviews fetched successfully.",
    data: result.reviews,
  });
});

export const bookingControllers = {
  createBooking,
  updateBooking,
  getBookingById,
  getMyBookingsAsStudent,
  getMyBookingsAsTutor,
  createReview,
  getReviewsByTutor,
};