import status from "http-status";
import { DayOfWeek } from "../../../generated/prisma/enums";
import {
  IAvailabilityCheckPayload,
  ISetAvailabilityPayload,
  IUpdateAvailabilitySlot,
} from "./availability.interface";
import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelper/AppError";
import { IRequestUser } from "../auth/auth.interface";

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────

const DAY_LABELS: Record<DayOfWeek, string> = {
  SUN: "Sunday", MON: "Monday", TUE: "Tuesday", WED: "Wednesday",
  THU: "Thursday", FRI: "Friday", SAT: "Saturday",
};

const DAY_ORDER: DayOfWeek[] = [
  DayOfWeek.SUN, DayOfWeek.MON, DayOfWeek.TUE, DayOfWeek.WED,
  DayOfWeek.THU, DayOfWeek.FRI, DayOfWeek.SAT,
];

const toMinutes = (time: string): number => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

const overlaps = (aStart: string, aEnd: string, bStart: string, bEnd: string): boolean =>
  toMinutes(aStart) < toMinutes(bEnd) && toMinutes(aEnd) > toMinutes(bStart);

const getDayOfWeekFromDate = (dateStr: string): DayOfWeek => {
  const day = new Date(dateStr).getUTCDay(); // UTC safe
  return DAY_ORDER[day];
};

/** শুধুমাত্র টিউটর প্রোফাইল আইডি রিটার্ন করবে */
const getTutorProfileId = async (userId: string) => {
  const profile = await prisma.tutorProfile.findUnique({ where: { userId } });
  if (!profile) throw new AppError(status.NOT_FOUND, "Tutor profile not found.");
  return profile.id;
};

// ─────────────────────────────────────────────────────────────
//  SERVICES
// ─────────────────────────────────────────────────────────────

const setAvailability = async (user: IRequestUser, payload: ISetAvailabilityPayload) => {
  const tutorId = await getTutorProfileId(user.userId);

  await prisma.$transaction([
    prisma.availability.deleteMany({ where: { tutorId } }),
    prisma.availability.createMany({
      data: payload.slots.map((slot) => ({
        tutorId,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isActive: slot.isActive ?? true,
      })),
    }),
  ]);

  return getGroupedAvailability(tutorId);
};

const updateSlot = async (user: IRequestUser, slotId: string, data: IUpdateAvailabilitySlot) => {
  const tutorId = await getTutorProfileId(user.userId);
  const slot = await prisma.availability.findUnique({ where: { id: slotId } });

  if (!slot || slot.tutorId !== tutorId) {
    throw new AppError(status.FORBIDDEN, "Access denied or slot not found.");
  }

  return await prisma.availability.update({
    where: { id: slotId },
    data: {
      ...(data.startTime && { startTime: data.startTime }),
      ...(data.endTime && { endTime: data.endTime }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });
};

const checkAvailability = async (payload: IAvailabilityCheckPayload) => {
  const { tutorId, bookingDate, startTime, endTime } = payload;

  const requestedDay = getDayOfWeekFromDate(bookingDate);

  // ১. স্লট চেক (Tutor's working hours)
  const coveringSlot = await prisma.availability.findFirst({
    where: {
      tutorId,
      dayOfWeek: requestedDay,
      isActive: true,
      startTime: { lte: startTime },
      endTime: { gte: endTime },
    },
  });

  if (!coveringSlot) {
    return { available: false, reason: "Tutor is not available in this time slot." };
  }

  // ২. কনফ্লিক্ট চেক (Existing bookings)
  const existingBookings = await prisma.booking.findMany({
    where: {
      tutorId,
      bookingDate: new Date(bookingDate),
      status: { in: ["PENDING", "ACCEPTED"] },
    },
  });

  for (const booking of existingBookings) {
    // DB এর DateTime থেকে HH:mm স্ট্রিং বের করা
    const bStart = new Date(booking.startTime).toISOString().substring(11, 16);
    const bEnd = new Date(booking.endTime).toISOString().substring(11, 16);

    if (overlaps(startTime, endTime, bStart, bEnd)) {
      return { available: false, reason: "Tutor is already booked at this time." };
    }
  }

  return { available: true, slot: coveringSlot };
};

const getMyAvailability = async (user: IRequestUser) => {
  const tutorId = await getTutorProfileId(user.userId);
  return getGroupedAvailability(tutorId);
};

const getPublicAvailability = async (tutorProfileId: string) => {
  const slots = await prisma.availability.findMany({
    where: { tutorId: tutorProfileId, isActive: true },
    orderBy: { startTime: "asc" },
  });

  return DAY_ORDER.map((day) => ({
    dayOfWeek: day,
    dayLabel: DAY_LABELS[day],
    slots: slots.filter((s) => s.dayOfWeek === day),
  }));
};

const deleteSlot = async (user: IRequestUser, slotId: string) => {
  const tutorId = await getTutorProfileId(user.userId);
  await prisma.availability.delete({ where: { id: slotId, tutorId } });
  return { message: "Slot deleted." };
};

// ─────────────────────────────────────────────────────────────
//  PRIVATE HELPERS
// ─────────────────────────────────────────────────────────────

const getGroupedAvailability = async (tutorId: string) => {
  const slots = await prisma.availability.findMany({
    where: { tutorId },
    orderBy: { startTime: "asc" },
  });

  return DAY_ORDER.map((day) => ({
    dayOfWeek: day,
    dayLabel: DAY_LABELS[day],
    slots: slots.filter((s) => s.dayOfWeek === day),
  }));
};

export const availabilityService = {
  setAvailability,
  updateSlot,
  deleteSlot,
  getMyAvailability,
  getPublicAvailability,
  checkAvailability,
};