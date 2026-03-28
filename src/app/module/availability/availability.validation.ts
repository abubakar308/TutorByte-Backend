import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const DAY_VALUES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

// ─────────────────────────────────────────────────────────────
//  SLOT SCHEMA
//
//  ⚠️  No .default() here — Zod v4 + validateRequest middleware
//  drops fields that have defaults when using safeParseAsync.
//  isActive is fully optional — service defaults it to true.
// ─────────────────────────────────────────────────────────────

const slotSchema = z
  .object({
    dayOfWeek: z.enum(DAY_VALUES, {
      message: `dayOfWeek must be one of: ${DAY_VALUES.join(", ")}.`,
    }),
    startTime: z
      .string({ message: "startTime is required." })
      .regex(timeRegex, 'startTime must be HH:MM 24-hour format, e.g. "09:00"'),
    endTime: z
      .string({ message: "endTime is required." })
      .regex(timeRegex, 'endTime must be HH:MM 24-hour format, e.g. "11:00"'),
    isActive: z.boolean().optional(),   // ← optional, no default()
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "startTime must be before endTime.",
    path: ["endTime"],
  });

// ─────────────────────────────────────────────────────────────
//  PUT /availability  — full replace
//
//  Postman body:
//  {
//    "slots": [
//      { "dayOfWeek": "MON", "startTime": "10:00", "endTime": "12:00" },
//      { "dayOfWeek": "WED", "startTime": "14:00", "endTime": "16:00" }
//    ]
//  }
// ─────────────────────────────────────────────────────────────

const setAvailabilitySchema = z.object({
  body: z.object({
    slots: z
      .array(slotSchema)
      .min(1, "At least one slot is required.")
      .max(28, "Maximum 28 slots (4 per day × 7 days)."),
  }),
});

// ─────────────────────────────────────────────────────────────
//  POST /availability/slot  — add single slot
//
//  Postman body:
//  { "dayOfWeek": "MON", "startTime": "10:00", "endTime": "12:00" }
// ─────────────────────────────────────────────────────────────

const addSlotSchema = z.object({
  body: slotSchema,
});

// ─────────────────────────────────────────────────────────────
//  PATCH /availability/slot/:slotId  — update one slot
//
//  Postman body (send only what you want to change):
//  { "startTime": "11:00" }
//  { "isActive": false }
//  { "startTime": "11:00", "endTime": "13:00" }
// ─────────────────────────────────────────────────────────────

const updateSlotSchema = z.object({
  body: z
    .object({
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
    .refine((data) => Object.keys(data).length > 0, {
      message: "Provide at least one field to update.",
    })
    .refine(
      (data) => {
        if (data.startTime && data.endTime) return data.startTime < data.endTime;
        return true;
      },
      { message: "startTime must be before endTime.", path: ["endTime"] }
    ),
});

// ─────────────────────────────────────────────────────────────
//  GET /availability/:tutorId/check
//  Query: ?bookingDate=2025-08-10&startTime=10:00&endTime=11:00
// ─────────────────────────────────────────────────────────────

const checkAvailabilitySchema = z.object({
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
  setAvailabilitySchema,
  addSlotSchema,
  updateSlotSchema,
  checkAvailabilitySchema,
};