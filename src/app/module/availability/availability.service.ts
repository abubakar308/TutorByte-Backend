import status from "http-status";
import { DayOfWeek, UserRole } from "../../../generated/prisma/enums";

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

/** Load own ID — returns tutorProfile.id for TUTOR, or userId for STUDENT */
const getTargetIds = async (user: IRequestUser) => {
  if (user.role === UserRole.TUTOR) {
    const profile = await prisma.tutorProfile.findUnique({ where: { userId: user.userId } });
    if (!profile) {
      throw new AppError(status.NOT_FOUND, "Tutor profile not found.");
    }
    return { tutorId: profile.id };
  }
  return { studentId: user.userId };
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
  const ids = await getTargetIds(user);

  // Validate no overlapping slots on the same day
  assertNoOverlaps(payload.slots);

  // Full replace inside a transaction
  await prisma.$transaction([
    prisma.availability.deleteMany({ where: ids }),
    prisma.availability.createMany({
      data: payload.slots.map((slot) => ({
        ...ids,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isActive: slot.isActive !== undefined ? slot.isActive : true,
      })),
    }),
  ]);

  return getGroupedAvailability(ids);
};

// ─────────────────────────────────────────────────────────────
//  ADD A SINGLE SLOT
// ─────────────────────────────────────────────────────────────

const addSlot = async (user: IRequestUser, slot: IAvailabilitySlot) => {
  const ids = await getTargetIds(user);

  // Check new slot doesn't overlap existing slots on the same day
  const existingSlots = await prisma.availability.findMany({
    where: { ...ids, dayOfWeek: slot.dayOfWeek },
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
      ...ids,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isActive: slot.isActive !== undefined ? slot.isActive : true,
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
  const ids = await getTargetIds(user);
  const slot = await prisma.availability.findUnique({ where: { id: slotId } });

  if (!slot) {
    throw new AppError(status.NOT_FOUND, "Availability slot not found.");
  }

  // Ownership check
  if ((ids.tutorId && slot.tutorId !== ids.tutorId) || (ids.studentId && slot.studentId !== ids.studentId)) {
    throw new AppError(status.FORBIDDEN, "You can only update your own availability slots.");
  }

  const newStart = data.startTime ?? slot.startTime;
  const newEnd = data.endTime ?? slot.endTime;

  if (newStart >= newEnd) {
    throw new AppError(status.BAD_REQUEST, "startTime must be before endTime.");
  }

  // Check updated times don't overlap other slots on the same day (excluding self)
  const siblings = await prisma.availability.findMany({
    where: {
      ...ids,
      dayOfWeek: slot.dayOfWeek,
      id: { not: slotId },
    },
  });

  for (const s of siblings) {
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
  const ids = await getTargetIds(user);
  const slot = await prisma.availability.findUnique({ where: { id: slotId } });

  if (!slot) {
    throw new AppError(status.NOT_FOUND, "Availability slot not found.");
  }

  if ((ids.tutorId && slot.tutorId !== ids.tutorId) || (ids.studentId && slot.studentId !== ids.studentId)) {
    throw new AppError(status.FORBIDDEN, "You can only delete your own availability slots.");
  }

  await prisma.availability.delete({ where: { id: slotId } });

  return { message: "Slot deleted successfully." };
};

// ─────────────────────────────────────────────────────────────
//  GET MY AVAILABILITY
// ─────────────────────────────────────────────────────────────

const getMyAvailability = async (user: IRequestUser) => {
  const ids = await getTargetIds(user);
  return getGroupedAvailability(ids);
};

// ─────────────────────────────────────────────────────────────
//  GET PUBLIC AVAILABILITY
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

  return DAY_ORDER.map((day) => ({
    dayOfWeek: day,
    dayLabel: DAY_LABELS[day],
    slots: slots.filter((s) => s.dayOfWeek === day),
  }));
};

// ─────────────────────────────────────────────────────────────
//  CHECK AVAILABILITY
// ─────────────────────────────────────────────────────────────

const checkAvailability = async (payload: IAvailabilityCheckPayload) => {
  const { tutorId, bookingDate, startTime, endTime } = payload;

  const profile = await prisma.tutorProfile.findUnique({
    where: { id: tutorId, isApproved: true },
  });

  if (!profile) {
    throw new AppError(status.NOT_FOUND, "Tutor not found.");
  }

  const requestedDay = getDayOfWeekFromDate(bookingDate);

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
    return {
      available: false,
      reason: `Tutor is not available during the requested time (${startTime}–${endTime}) on ${DAY_LABELS[requestedDay]}s.`,
    };
  }

  const conflict = await prisma.booking.findFirst({
    where: {
      tutorId,
      bookingDate: new Date(bookingDate),
      status: { in: ["PENDING", "ACCEPTED"] },
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
//  TOGGLE SLOT
// ─────────────────────────────────────────────────────────────

const toggleSlot = async (user: IRequestUser, slotId: string) => {
  const ids = await getTargetIds(user);
  const slot = await prisma.availability.findUnique({ where: { id: slotId } });

  if (!slot) throw new AppError(status.NOT_FOUND, "Availability slot not found.");
  if ((ids.tutorId && slot.tutorId !== ids.tutorId) || (ids.studentId && slot.studentId !== ids.studentId)) {
    throw new AppError(status.FORBIDDEN, "You can only toggle your own slots.");
  }

  const updated = await prisma.availability.update({
    where: { id: slotId },
    data: { isActive: !slot.isActive },
  });

  return updated;
};

// ─────────────────────────────────────────────────────────────
//  PRIVATE HELPERS
// ─────────────────────────────────────────────────────────────

const getGroupedAvailability = async (ids: { tutorId?: string; studentId?: string }) => {
  const slots = await prisma.availability.findMany({
    where: ids,
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