import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const createProfileSchema = z.object({
  body: z.object({
    bio: z
      .string({ error: "Bio is required." })
      .min(50, "Bio must be at least 50 characters.")
      .max(1000, "Bio must not exceed 1000 characters."),

    hourlyRate: z
      .number({ error: "Hourly rate is required." })
      .positive("Hourly rate must be greater than 0.")
      .max(10000, "Hourly rate seems too high."),

    subjects: z
      .array(z.string().uuid("Invalid subject ID."))
      .min(1, "At least one subject is required.")
      .max(10, "Maximum 10 subjects allowed."),

    languages: z
      .array(z.string().uuid("Invalid language ID."))
      .min(1, "At least one language is required.")
      .max(10, "Maximum 10 languages allowed."),

    experienceYrs: z
      .number()
      .int()
      .min(0)
      .max(50)
      .optional(),
  }),
});

const updateProfileSchema = z.object({
  body: z.object({
    bio: z.string().min(50).max(1000).optional(),
    hourlyRate: z.number().positive().max(10000).optional(),
    subjects: z.array(z.string().uuid()).min(1).max(10).optional(),
    languages: z.array(z.string().uuid()).min(1).max(10).optional(),
    experienceYrs: z.number().int().min(0).max(50).optional(),
  }),
});

const availabilitySlotSchema = z.object({
  dayOfWeek: z
    .number({ error: "dayOfWeek is required." })
    .int()
    .min(0, "dayOfWeek must be 0 (Sun) to 6 (Sat).")
    .max(6, "dayOfWeek must be 0 (Sun) to 6 (Sat)."),

  startTime: z
    .string({ error: "startTime is required." })
    .regex(timeRegex, "startTime must be in HH:MM format (24-hour)."),

  endTime: z
    .string({ error: "endTime is required." })
    .regex(timeRegex, "endTime must be in HH:MM format (24-hour)."),

  isRecurring: z.boolean().optional().default(true),

});

const setAvailabilitySchema = z.object({
  body: z.object({
    slots: z
      .array(availabilitySlotSchema)
      .min(1, "At least one availability slot is required.")
      .max(50, "Maximum 50 slots allowed."),
  }),
});

const deleteCertificateSchema = z.object({
  body: z.object({
    certificateUrl: z
      .string({ error: "certificateUrl is required." })
      .url("Must be a valid URL."),
  }),
});


const searchQuerySchema = z.object({
  query: z.object({
    subject: z.string().optional(),
    language: z.string().optional(),
    minPrice: z.coerce.number().positive().optional(),
    maxPrice: z.coerce.number().positive().optional(),
    minRating: z.coerce.number().min(1).max(5).optional(),
    search: z.string().max(100).optional(),
    sortBy: z.enum(["rating", "price_asc", "price_desc", "reviews"]).optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
  }),
});


export const TutorValidation = {
  createProfileSchema,
  updateProfileSchema,
  setAvailabilitySchema,
  deleteCertificateSchema,
  searchQuerySchema,
};