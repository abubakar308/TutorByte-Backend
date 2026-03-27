import { z } from 'zod';

export const createBookingSchema = z.object({
  tutorId: z.string().uuid(),
  bookingDate: z.string().refine(val => !isNaN(Date.parse(val)), "Invalid date"),
  startTime: z.string(), 
  endTime: z.string(),
  totalPrice: z.number().positive(),
});

export const updateBookingSchema = z.object({
  status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED']).optional(),
});

export const createReviewSchema = z.object({
  tutorId: z.string().uuid(),
  rating: z.number().min(1).max(5),
  comment: z.string().min(1),
});