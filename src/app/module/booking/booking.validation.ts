import { z } from "zod";
import { BookingStatus } from "../../../generated/prisma/enums";

const timeRegex = /^([0-1]?\d|2[0-3]):[0-5]\d$/;

// ── Booking ───────────────────────────────────────────────────

export const createBookingSchema = z.object({
  body: z.object({
    tutorId: z.string({ message: "Tutor ID is required." }).uuid("Invalid tutor ID."),
    subjectId: z.string({ message: "Subject ID is required." }).uuid("Invalid subject ID."),

  bookingDate: z
  .string({ message: "Booking date is required." })
  .refine((val) => {
    const selectedDate = new Date(val);
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    return selectedDate >= today;
  }, "Booking date cannot be in the past."),

    startTime: z
      .string({ message: "Start time is required." })
      .regex(timeRegex, "startTime must be HH:MM (24-hour)."),

    endTime: z
      .string({ message: "End time is required." })
      .regex(timeRegex, "endTime must be HH:MM (24-hour)."),
  }).refine(
    (data) => data.startTime < data.endTime,
    { message: "startTime must be before endTime.", path: ["endTime"] }
  ),
});

export const updateBookingSchema = z.object({
  body: z.object({
    status: z.enum(BookingStatus).optional(),
    meetingLink: z.string({ message: "Meeting link is required." }).url("Must be a valid URL.").optional(),
  }).refine(
    (data) => data.status !== undefined || data.meetingLink !== undefined,
    { message: "Provide at least status or meetingLink." }
  ),
});

export const bookingQuerySchema = z.object({
  query: z.object({
    status: z.enum(BookingStatus).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    searchTerm: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
  }),
});

// ── Review ────────────────────────────────────────────────────

export const createReviewSchema = z.object({
  body: z.object({
    bookingId: z.string().uuid("Invalid booking ID."),
    tutorId: z.string().uuid("Invalid tutor ID."), 
    rating: z
      .number({ message: "Rating is required." })
      .int()
      .min(1, "Minimum rating is 1.")
      .max(5, "Maximum rating is 5."),
    comment: z
      .string({ message: "Comment is required." })
      .min(10, "Comment must be at least 10 characters.")
      .max(500, "Comment must not exceed 500 characters."), // Optional: adjust length constraints as needed
  }),
});