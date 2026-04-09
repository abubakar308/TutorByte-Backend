import status from "http-status";
import AppError from "../../errorHelper/AppError";
import { prisma } from "../../lib/prisma";
import { BookingStatus } from "../../../generated/prisma/enums";
import { IReviewCreate } from "./review.interface";

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
        comment: data.comment || "",
      },
      include: {
        student: { select: { id: true, name: true, image: true } },
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


const getMyReviews = async (studentId: string) => {
  return await prisma.review.findMany({
    where: { studentId },
    include: {
      tutor: { include: { user: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
};


const getAllReviews = async () => {

   const reviews = await prisma.review.findMany({
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      tutor: {
        select: {
          id: true,
          bio: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return reviews;
};


export const reviewService = {
    createReview,
    getMyReviews,
    getAllReviews,
};