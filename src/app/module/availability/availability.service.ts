import status from "http-status";
import { DayOfWeek } from "../../../generated/prisma/enums";

import {
  IAvailabilityCheckPayload,
  IAvailabilitySlot,
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
  SUN: "Sunday",
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
};

const DAY_ORDER: DayOfWeek[] = [
  DayOfWeek.SUN,
  DayOfWeek.MON,
  DayOfWeek.TUE,
  DayOfWeek.WED,
  DayOfWeek.THU,
  DayOfWeek.FRI,
  DayOfWeek.SAT,
];

/** "HH:MM" → total minutes from midnight */
const toMinutes = (time: string): number => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

/** Check if two time ranges overlap */
const overlaps = (
  aStart: string, aEnd: string,
  bStart: string, bEnd: string
): boolean =>
  toMinutes(aStart) < toMinutes(bEnd) &&
  toMinutes(aEnd) > toMinutes(bStart);

/** Get the ISO day-of-week index from a date string for a given DayOfWeek enum */
const getDayOfWeekFromDate = (dateStr: string): DayOfWeek => {
  const day = new Date(dateStr).getDay(); // 0 = Sunday
  return DAY_ORDER[day];
};

/** Load own TutorProfile — throws 404 if not found */
const getOwnProfile = async (userId: string) => {
  const profile = await prisma.tutorProfile.findUnique({ where: { userId } });
  if (!profile) {
    throw new AppError(
      status.NOT_FOUND,
      "Tutor profile not found. Please create your profile first."
    );
  }
  return profile;
};

/** Detect overlapping slots within the same day */
const assertNoOverlaps = (slots: IAvailabilitySlot[]) => {
  const byDay: Record<string, IAvailabilitySlot[]> = {};

  for (const slot of slots) {
    if (!byDay[slot.dayOfWeek]) byDay[slot.dayOfWeek] = [];
    byDay[slot.dayOfWeek].push(slot);
  }

  for (const [day, daySlots] of Object.entries(byDay)) {
    const sorted = [...daySlots].sort((a, b) =>
      a.startTime.localeCompare(b.startTime)
    );

    for (let i = 0; i < sorted.length - 1; i++) {
      if (overlaps(
        sorted[i].startTime, sorted[i].endTime,
        sorted[i + 1].startTime, sorted[i + 1].endTime
      )) {
        throw new AppError(
          status.BAD_REQUEST,
          `Overlapping slots on ${DAY_LABELS[day as DayOfWeek]}: ` +
          `${sorted[i].startTime}–${sorted[i].endTime} overlaps ` +
          `${sorted[i + 1].startTime}–${sorted[i + 1].endTime}.`
        );
      }
    }
  }
};

// ─────────────────────────────────────────────────────────────
//  SET AVAILABILITY  (full replace)
// ─────────────────────────────────────────────────────────────

const setAvailability = async (
  user: IRequestUser,
  payload: ISetAvailabilityPayload
) => {
  const profile = await getOwnProfile(user.userId);

  // Validate no overlapping slots on the same day
  assertNoOverlaps(payload.slots);

  // Full replace inside a transaction
  await prisma.$transaction([
    prisma.availability.deleteMany({ where: { tutorId: profile.id } }),
    prisma.availability.createMany({
      data: payload.slots.map((slot) => ({
        tutorId: profile.id,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isActive: slot.isActive,
      })),
    }),
  ]);

  // Return grouped result
  return getGroupedAvailability(profile.id);
};

// ─────────────────────────────────────────────────────────────
//  ADD A SINGLE SLOT
// ─────────────────────────────────────────────────────────────

const addSlot = async (user: IRequestUser, slot: IAvailabilitySlot) => {
  const profile = await getOwnProfile(user.userId);

  // Check new slot doesn't overlap existing slots on the same day
  const existingSlots = await prisma.availability.findMany({
    where: { tutorId: profile.id, dayOfWeek: slot.dayOfWeek },
  });

  for (const existing of existingSlots) {
    if (overlaps(slot.startTime, slot.endTime, existing.startTime, existing.endTime)) {
      throw new AppError(
        status.CONFLICT,
        `This slot overlaps with an existing slot on ${DAY_LABELS[slot.dayOfWeek]}: ` +
        `${existing.startTime}–${existing.endTime}.`
      );
    }
  }

  const newSlot = await prisma.availability.create({
    data: {
      tutorId: profile.id,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isActive: slot.isActive,
    },
  });

  return newSlot;
};

// ─────────────────────────────────────────────────────────────
//  UPDATE A SINGLE SLOT
// ─────────────────────────────────────────────────────────────

const updateSlot = async (
  user: IRequestUser,
  slotId: string,
  data: IUpdateAvailabilitySlot
) => {
  const profile = await getOwnProfile(user.userId);

  const slot = await prisma.availability.findUnique({ where: { id: slotId } });

  if (!slot) {
    throw new AppError(status.NOT_FOUND, "Availability slot not found.");
  }

  // Ownership check
  if (slot.tutorId !== profile.id) {
    throw new AppError(status.FORBIDDEN, "You can only update your own availability slots.");
  }

  const newStart = data.startTime ?? slot.startTime;
  const newEnd = data.endTime ?? slot.endTime;

  if (newStart >= newEnd) {
    throw new AppError(status.BAD_REQUEST, "startTime must be before endTime.");
  }

  // Check updated times don't overlap other slots on the same day (excluding self)
  const sibling = await prisma.availability.findMany({
    where: {
      tutorId: profile.id,
      dayOfWeek: slot.dayOfWeek,
      id: { not: slotId },
    },
  });

  for (const s of sibling) {
    if (overlaps(newStart, newEnd, s.startTime, s.endTime)) {
      throw new AppError(
        status.CONFLICT,
        `Updated slot overlaps with existing slot on ${DAY_LABELS[slot.dayOfWeek]}: ` +
        `${s.startTime}–${s.endTime}.`
      );
    }
  }

  const updated = await prisma.availability.update({
    where: { id: slotId },
    data: {
      ...(data.startTime !== undefined && { startTime: data.startTime }),
      ...(data.endTime !== undefined && { endTime: data.endTime }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });

  return updated;
};

// ─────────────────────────────────────────────────────────────
//  DELETE A SINGLE SLOT
// ─────────────────────────────────────────────────────────────

const deleteSlot = async (user: IRequestUser, slotId: string) => {
  const profile = await getOwnProfile(user.userId);

  const slot = await prisma.availability.findUnique({ where: { id: slotId } });

  if (!slot) {
    throw new AppError(status.NOT_FOUND, "Availability slot not found.");
  }

  if (slot.tutorId !== profile.id) {
    throw new AppError(status.FORBIDDEN, "You can only delete your own availability slots.");
  }

  await prisma.availability.delete({ where: { id: slotId } });

  return { message: "Slot deleted successfully." };
};

// ─────────────────────────────────────────────────────────────
//  GET MY AVAILABILITY  (tutor's own — all slots, grouped)
// ─────────────────────────────────────────────────────────────

const getMyAvailability = async (user: IRequestUser) => {
  const profile = await getOwnProfile(user.userId);
  return getGroupedAvailability(profile.id);
};

// ─────────────────────────────────────────────────────────────
//  GET PUBLIC AVAILABILITY  (by tutorProfileId — only active)
// ─────────────────────────────────────────────────────────────

const getPublicAvailability = async (tutorProfileId: string) => {
  const profile = await prisma.tutorProfile.findUnique({
    where: { id: tutorProfileId, isApproved: true },
  });

  if (!profile) {
    throw new AppError(status.NOT_FOUND, "Tutor not found.");
  }

  const slots = await prisma.availability.findMany({
    where: { tutorId: tutorProfileId, isActive: true },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  // Group by day — only show active slots to public
  return DAY_ORDER.map((day) => ({
    dayOfWeek: day,
    dayLabel: DAY_LABELS[day],
    slots: slots.filter((s) => s.dayOfWeek === day),
  }));
};

// ─────────────────────────────────────────────────────────────
//  CHECK AVAILABILITY  (is a specific slot free?)
// ─────────────────────────────────────────────────────────────

const checkAvailability = async (payload: IAvailabilityCheckPayload) => {
  const { tutorId, bookingDate, startTime, endTime } = payload;

  const profile = await prisma.tutorProfile.findUnique({
    where: { id: tutorId, isApproved: true },
  });

  if (!profile) {
    throw new AppError(status.NOT_FOUND, "Tutor not found.");
  }

  // 1. Check tutor has an ACTIVE slot covering this day + time range
  const requestedDay = getDayOfWeekFromDate(bookingDate);

  const coveringSlot = await prisma.availability.findFirst({
    where: {
      tutorId,
      dayOfWeek: requestedDay,
      isActive: true,
    },
  });

  if (!coveringSlot) {
    return {
      available: false,
      reason: `Tutor is not available on ${DAY_LABELS[requestedDay]}s.`,
    };
  }

  // Check the requested time falls within the slot
  if (
    toMinutes(startTime) < toMinutes(coveringSlot.startTime) ||
    toMinutes(endTime) > toMinutes(coveringSlot.endTime)
  ) {
    return {
      available: false,
      reason: `Tutor is only available ${coveringSlot.startTime}–${coveringSlot.endTime} on ${DAY_LABELS[requestedDay]}s.`,
    };
  }

  // 2. Check no conflicting PENDING or ACCEPTED booking exists
  const { BookingStatus } = await import("../../../generated/prisma/enums");

  const conflict = await prisma.booking.findFirst({
    where: {
      tutorId,
      bookingDate: new Date(bookingDate),
      status: { in: [BookingStatus.PENDING, BookingStatus.ACCEPTED] },
    },
  });

  if (conflict && overlaps(startTime, endTime, conflict.startTime, conflict.endTime)) {
    return {
      available: false,
      reason: `Tutor already has a booking from ${conflict.startTime}–${conflict.endTime} on this date.`,
    };
  }

  return {
    available: true,
    reason: null,
    slot: coveringSlot,
  };
};

// ─────────────────────────────────────────────────────────────
//  TOGGLE SLOT ACTIVE/INACTIVE
// ─────────────────────────────────────────────────────────────

const toggleSlot = async (user: IRequestUser, slotId: string) => {
  const profile = await getOwnProfile(user.userId);

  const slot = await prisma.availability.findUnique({ where: { id: slotId } });

  if (!slot) throw new AppError(status.NOT_FOUND, "Availability slot not found.");
  if (slot.tutorId !== profile.id) {
    throw new AppError(status.FORBIDDEN, "You can only toggle your own slots.");
  }

  const updated = await prisma.availability.update({
    where: { id: slotId },
    data: { isActive: !slot.isActive },
  });

  return updated;
};

// ─────────────────────────────────────────────────────────────
//  PRIVATE: group slots by day (used internally)
// ─────────────────────────────────────────────────────────────

const getGroupedAvailability = async (tutorProfileId: string) => {
  const slots = await prisma.availability.findMany({
    where: { tutorId: tutorProfileId },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return DAY_ORDER.map((day) => ({
    dayOfWeek: day,
    dayLabel: DAY_LABELS[day],
    slots: slots.filter((s) => s.dayOfWeek === day),
    activeCount: slots.filter((s) => s.dayOfWeek === day && s.isActive).length,
    totalCount: slots.filter((s) => s.dayOfWeek === day).length,
  }));
};

// ─────────────────────────────────────────────────────────────
//  EXPORTS
// ─────────────────────────────────────────────────────────────

export const availabilityService = {
  setAvailability,
  addSlot,
  updateSlot,
  deleteSlot,
  toggleSlot,
  getMyAvailability,
  getPublicAvailability,
  checkAvailability,
};