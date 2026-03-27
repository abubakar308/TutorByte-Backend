import status from "http-status";
import { BookingStatus } from "../../../generated/prisma/enums";
import { IBookingCreate, IBookingQuery, IBookingUpdate, IReviewCreate } from "./booking.interface";
import { prisma } from "../../lib/prisma";
import AppError from "../../errorHelper/AppError";

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────

/** Convert "HH:MM" to total minutes from midnight for easy comparison */
const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

/** Check if two time ranges overlap */
const timesOverlap = (
  aStart: string, aEnd: string,
  bStart: string, bEnd: string
): boolean => {
  return (
    timeToMinutes(aStart) < timeToMinutes(bEnd) &&
    timeToMinutes(aEnd) > timeToMinutes(bStart)
  );
};

const getPagination = (page = 1, limit = 10) => ({
  skip: (page - 1) * Math.min(limit, 50),
  take: Math.min(limit, 50),
});

// ─────────────────────────────────────────────────────────────
//  CREATE BOOKING
// ─────────────────────────────────────────────────────────────

const createBooking = async (studentId: string, data: IBookingCreate) => {
  const { tutorId, bookingDate, startTime, endTime, totalPrice } = data;

  // 1. Tutor must exist and be approved
  const tutor = await prisma.tutorProfile.findUnique({
    where: { id: tutorId },
    include: { user: true },
  });

  if (!tutor) {
    throw new AppError(status.NOT_FOUND, "Tutor not found.");
  }

  if (!tutor.isApproved) {
    throw new AppError(
      status.BAD_REQUEST,
      "This tutor is not yet approved. Please choose another tutor."
    );
  }

  // 2. Student cannot book themselves
  if (tutor.userId === studentId) {
    throw new AppError(status.BAD_REQUEST, "You cannot book yourself.");
  }

  // 3. Booking date must be in the future
  const bookingDateObj = new Date(bookingDate);
  if (bookingDateObj < new Date()) {
    throw new AppError(status.BAD_REQUEST, "Booking date must be in the future.");
  }

  // 4. Check for conflicting bookings on the same tutor + date
  // (tutor already has an ACCEPTED or PENDING booking that overlaps)
  const conflictingBooking = await prisma.booking.findFirst({
    where: {
      tutorId,
      bookingDate: bookingDateObj,
      status: { in: [BookingStatus.PENDING, BookingStatus.ACCEPTED] },
    },
  });

  if (conflictingBooking) {
    const conflicts = timesOverlap(
      startTime, endTime,
      conflictingBooking.startTime, conflictingBooking.endTime
    );

    if (conflicts) {
      throw new AppError(
        status.CONFLICT,
        `This tutor already has a booking from ${conflictingBooking.startTime} to ${conflictingBooking.endTime} on that date.`
      );
    }
  }

  // 5. Check student doesn't already have a booking at the same time
  const studentConflict = await prisma.booking.findFirst({
    where: {
      studentId,
      bookingDate: bookingDateObj,
      status: { in: [BookingStatus.PENDING, BookingStatus.ACCEPTED] },
    },
  });

  if (studentConflict) {
    const conflicts = timesOverlap(
      startTime, endTime,
      studentConflict.startTime, studentConflict.endTime
    );

    if (conflicts) {
      throw new AppError(
        status.CONFLICT,
        `You already have a booking from ${studentConflict.startTime} to ${studentConflict.endTime} on that date.`
      );
    }
  }

  // 6. Create the booking
  const booking = await prisma.booking.create({
    data: {
      studentId,
      tutorId,
      bookingDate: bookingDateObj,
      startTime,
      endTime,
      totalPrice,
      status: BookingStatus.PENDING,
      meetingLink: null,
    },
    include: {
      tutor: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      student: { select: { id: true, name: true, email: true } },
    },
  });

  return booking;
};

// ─────────────────────────────────────────────────────────────
//  UPDATE BOOKING STATUS
// ─────────────────────────────────────────────────────────────

const updateBookingStatus = async (
  requesterId: string,
  requesterRole: string,
  bookingId: string,
  data: IBookingUpdate
) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      tutor: true,
      student: { select: { id: true, name: true, email: true } },
    },
  });

  if (!booking) {
    throw new AppError(status.NOT_FOUND, "Booking not found.");
  }

  // ── Role-based permission rules ──────────────────────────────
  //
  // TUTOR:   can ACCEPT, REJECT, add meetingLink
  // STUDENT: can CANCEL (only if PENDING)
  // ADMIN:   can do anything

  if (requesterRole === "TUTOR") {
    // Make sure this tutor owns the booking
    if (booking.tutor.userId !== requesterId) {
      throw new AppError(
        status.FORBIDDEN,
        "You can only manage your own bookings."
      );
    }

    const allowedTutorTransitions: Partial<Record<BookingStatus, BookingStatus[]>> = {
      [BookingStatus.PENDING]: [BookingStatus.ACCEPTED, BookingStatus.REJECTED],
      [BookingStatus.ACCEPTED]: [BookingStatus.COMPLETED],
    };

    if (
      data.status &&
      !allowedTutorTransitions[booking.status]?.includes(data.status)
    ) {
      throw new AppError(
        status.BAD_REQUEST,
        `Cannot transition booking from ${booking.status} to ${data.status}.`
      );
    }
  }

  if (requesterRole === "STUDENT") {
    // Students can only cancel their own PENDING bookings
    if (booking.studentId !== requesterId) {
      throw new AppError(
        status.FORBIDDEN,
        "You can only manage your own bookings."
      );
    }

    if (data.status && data.status !== BookingStatus.CANCELLED) {
      throw new AppError(
        status.FORBIDDEN,
        "Students can only cancel bookings."
      );
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new AppError(
        status.BAD_REQUEST,
        "You can only cancel a booking that is still pending."
      );
    }
  }

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      ...(data.status && { status: data.status }),
      // ...(data.meetingLink !== undefined && { meetingLink: data.meetingLink }),
    },
    include: {
      tutor: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      student: { select: { id: true, name: true, email: true } },
      payment: true,
    },
  });

  return updated;
};

// ─────────────────────────────────────────────────────────────
//  GET BOOKINGS — STUDENT
// ─────────────────────────────────────────────────────────────

const getBookingsByStudent = async (
  studentId: string,
  query: IBookingQuery
) => {
  const { skip, take } = getPagination(query.page, query.limit);

  const where = {
    studentId,
    ...(query.status && { status: query.status }),
  };

  const [total, bookings] = await prisma.$transaction([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      include: {
        tutor: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
        payment: { select: { status: true, amount: true } },
      },
      orderBy: { bookingDate: "desc" },
      skip,
      take,
    }),
  ]);

  return {
    bookings,
    meta: {
      total,
      page: query.page ?? 1,
      limit: take,
      totalPages: Math.ceil(total / take),
    },
  };
};

// ─────────────────────────────────────────────────────────────
//  GET BOOKINGS — TUTOR
// ─────────────────────────────────────────────────────────────

const getBookingsByTutor = async (
  tutorUserId: string,
  query: IBookingQuery
) => {
  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId: tutorUserId },
  });

  if (!tutorProfile) {
    throw new AppError(status.NOT_FOUND, "Tutor profile not found.");
  }

  const { skip, take } = getPagination(query.page, query.limit);

  const where = {
    tutorId: tutorProfile.id,
    ...(query.status && { status: query.status }),
  };

  const [total, bookings] = await prisma.$transaction([
    prisma.booking.count({ where }),
    prisma.booking.findMany({
      where,
      include: {
        student: {
          select: { id: true, name: true, avatarUrl: true, email: true },
        },
        payment: { select: { status: true, amount: true } },
      },
      orderBy: { bookingDate: "desc" },
      skip,
      take,
    }),
  ]);

  return {
    bookings,
    meta: {
      total,
      page: query.page ?? 1,
      limit: take,
      totalPages: Math.ceil(total / take),
    },
  };
};

// ─────────────────────────────────────────────────────────────
//  GET SINGLE BOOKING
// ─────────────────────────────────────────────────────────────

const getBookingById = async (requesterId: string, requesterRole: string, bookingId: string) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      tutor: {
        include: {
          user: { select: { id: true, name: true, avatarUrl: true, email: true } },
        },
      },
      student: { select: { id: true, name: true, avatarUrl: true, email: true } },
      payment: true,
    },
  });

  if (!booking) {
    throw new AppError(status.NOT_FOUND, "Booking not found.");
  }

  // Only the student, the tutor, or an admin can view a booking
  const isStudent = booking.studentId === requesterId;
  const isTutor = booking.tutorId === requesterId;
  const isAdmin = requesterRole === "ADMIN";

  if (!isStudent && !isTutor && !isAdmin) {
    throw new AppError(status.FORBIDDEN, "You do not have access to this booking.");
  }

  return booking;
};

// ─────────────────────────────────────────────────────────────
//  CREATE REVIEW
// ─────────────────────────────────────────────────────────────

const createReview = async (studentId: string, data: IReviewCreate) => {
  // 1. Booking must exist, belong to this student, and be COMPLETED
  const booking = await prisma.booking.findUnique({
    where: { id: data.bookingId },
  });

  if (!booking) {
    throw new AppError(status.NOT_FOUND, "Booking not found.");
  }

  if (booking.studentId !== studentId) {
    throw new AppError(
      status.FORBIDDEN,
      "You can only review your own bookings."
    );
  }

  if (booking.status !== BookingStatus.COMPLETED) {
    throw new AppError(
      status.BAD_REQUEST,
      "You can only review a completed session."
    );
  }

  // 2. Tutor from the booking must match submitted tutorId
  if (booking.tutorId !== data.tutorId) {
    throw new AppError(status.BAD_REQUEST, "Tutor ID does not match the booking.");
  }

  // 3. One review per booking — check if already reviewed
  const existingReview = await prisma.review.findFirst({
    where: { studentId, tutorId: data.tutorId },
  });

  if (existingReview) {
    throw new AppError(
      status.CONFLICT,
      "You have already reviewed this tutor for this booking."
    );
  }

  // 4. Create review + update tutor averageRating in a transaction
  const [review] = await prisma.$transaction(async (tx) => {
    const newReview = await tx.review.create({
      data: {
        studentId,
        tutorId: data.tutorId,
        rating: data.rating,
        comment: data.comment,
      },
      include: {
        student: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    // Recalculate average rating
    const aggregate = await tx.review.aggregate({
      where: { tutorId: data.tutorId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await tx.tutorProfile.update({
      where: { id: data.tutorId },
      data: {
        averageRating: aggregate._avg.rating ?? 0,
        totalReviews: aggregate._count.rating,
      },
    });

    return [newReview];
  });

  return review;
};

// ─────────────────────────────────────────────────────────────
//  GET REVIEWS BY TUTOR
// ─────────────────────────────────────────────────────────────

const getReviewsByTutor = async (
  tutorId: string,
  query: { page?: number; limit?: number }
) => {
  const { skip, take } = getPagination(query.page, query.limit);

  const tutor = await prisma.tutorProfile.findUnique({ where: { id: tutorId } });
  if (!tutor) {
    throw new AppError(status.NOT_FOUND, "Tutor not found.");
  }

  const [total, reviews] = await prisma.$transaction([
    prisma.review.count({ where: { tutorId } }),
    prisma.review.findMany({
      where: { tutorId },
      include: {
        student: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
  ]);

  return {
    reviews,
    summary: {
      averageRating: tutor.averageRating,
      totalReviews: tutor.totalReviews,
    },
    meta: {
      total,
      page: query.page ?? 1,
      limit: take,
      totalPages: Math.ceil(total / take),
    },
  };
};

// ─────────────────────────────────────────────────────────────
//  EXPORTS
// ─────────────────────────────────────────────────────────────

export const bookingService = {
  createBooking,
  updateBookingStatus,
  getBookingsByStudent,
  getBookingsByTutor,
  getBookingById,
  createReview,
  getReviewsByTutor,
};