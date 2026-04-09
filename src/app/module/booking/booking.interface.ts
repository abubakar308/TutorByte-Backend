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


export interface IBookingQuery {
  status?: BookingStatus;
  page?: number;
  limit?: number;
}

export interface IBookingQuery {
  page?: number;
  limit?: number;
  status?: BookingStatus;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
