import { z } from "zod";
import { DayOfWeek } from "../../../generated/prisma/enums";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const slotSchema = z.object({
  dayOfWeek: z.enum(DayOfWeek, {
    message: "Invalid day. Must be one of: SUNDAY, MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY.",
  }),
  startTime: z
    .string({ message: "startTime is required." })
    .regex(timeRegex, "startTime must be HH:MM (24-hour format)."),
  endTime: z
    .string({ message: "endTime is required." })
    .regex(timeRegex, "endTime must be HH:MM (24-hour format)."),
  isActive: z.boolean({ message: "isActive is required." }),
}).refine(
  (data) => data.startTime < data.endTime,
  { message: "startTime must be before endTime.", path: ["endTime"] }
);

// POST /tutors/availability/slot — add a single slot
export const addSlotSchema = z.object({
  body: slotSchema,
});

// PUT /tutors/availability  — full replace all slots
export const setAvailabilitySchema = z.object({
  body: z.object({
    slots: z
      .array(slotSchema)
      .min(1, "At least one slot is required.")
      .max(28, "Maximum 28 slots (4 per day × 7 days)."),
  }),
});

// PATCH /tutors/availability/:id  — update a single slot
export const updateSlotSchema = z.object({
  body: z.object({
    startTime: z
      .string()
      .regex(timeRegex, "startTime must be HH:MM (24-hour format).")
      .optional(),
    endTime: z
      .string()
      .regex(timeRegex, "endTime must be HH:MM (24-hour format).")
      .optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: "Provide at least one field to update." }
  )
  .refine(
    (data) => {
      if (data.startTime && data.endTime) return data.startTime < data.endTime;
      return true;
    },
    { message: "startTime must be before endTime.", path: ["endTime"] }
  ),
});

// GET /tutors/:tutorId/availability/check
export const checkAvailabilitySchema = z.object({
  query: z.object({
    bookingDate: z
      .string({ message: "bookingDate is required." })
      .refine((val) => !isNaN(Date.parse(val)), "Invalid date format."),
    startTime: z
      .string({ message: "startTime is required." })
      .regex(timeRegex, "startTime must be HH:MM."),
    endTime: z
      .string({ message: "endTime is required." })
      .regex(timeRegex, "endTime must be HH:MM."),
  }),
});

export const AvailabilityValidation = {
  addSlotSchema,
  setAvailabilitySchema,
  updateSlotSchema,
  checkAvailabilitySchema,
};