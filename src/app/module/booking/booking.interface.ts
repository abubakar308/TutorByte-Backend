import { BookingStatus } from "../../../generated/prisma/enums";

export interface IBookingCreate {
  tutorId: string;
  subjectId: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  totalPrice: number;
}

export interface IBookingUpdate {
  status?: BookingStatus;
  meetingLink?: string;
}

export interface IReviewCreate {
  tutorId: string;
  bookingId: string; // must reference a COMPLETED booking
  rating: number;
  comment: string;
}

export interface IBookingQuery {
  status?: BookingStatus;
  page?: number;
  limit?: number;
}