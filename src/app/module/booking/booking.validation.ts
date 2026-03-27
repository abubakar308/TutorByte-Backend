import { z } from "zod";
import { BookingStatus } from "../../../generated/prisma/enums";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

// ── Booking ───────────────────────────────────────────────────

export const createBookingSchema = z.object({
  body: z.object({
    tutorId: z.string().uuid("Invalid tutor ID."),

    bookingDate: z
      .string({ message: "Booking date is required." })
      .refine((val) => !isNaN(Date.parse(val)), "Invalid date format."),

    startTime: z
      .string({ message: "Start time is required." })
      .regex(timeRegex, "startTime must be HH:MM (24-hour)."),

    endTime: z
      .string({ message: "End time is required." })
      .regex(timeRegex, "endTime must be HH:MM (24-hour)."),

    totalPrice: z
      .number({ message: "Total price is required." })
      .positive("Total price must be greater than 0."),
  }).refine(
    (data) => data.startTime < data.endTime,
    { message: "startTime must be before endTime.", path: ["endTime"] }
  ),
});

export const updateBookingSchema = z.object({
  body: z.object({
    status: z.enum(BookingStatus).optional(),
    meetingLink: z.string().url("Must be a valid URL.").optional(),
  }).refine(
    (data) => data.status !== undefined || data.meetingLink !== undefined,
    { message: "Provide at least status or meetingLink." }
  ),
});

export const bookingQuerySchema = z.object({
  query: z.object({
    status: z.enum(BookingStatus).optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
  }),
});

// ── Review ────────────────────────────────────────────────────

export const createReviewSchema = z.object({
  body: z.object({
    bookingId: z.string().uuid("Invalid booking ID."),
    rating: z
      .number({ message: "Rating is required." })
      .int()
      .min(1, "Minimum rating is 1.")
      .max(5, "Maximum rating is 5."),
    comment: z
      .string({ message: "Comment is required." })
      .min(10, "Comment must be at least 10 characters.")
      .max(1000, "Comment must not exceed 1000 characters."),
  }),
});