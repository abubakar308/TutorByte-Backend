import status from "http-status";

import {
  ICreateTutorProfile,
  IUpdateTutorProfile,
} from "./tutor.interface";
import { IRequestUser } from "../auth/auth.interface";
import AppError from "../../errorHelper/AppError";
import { prisma } from "../../lib/prisma";
import { deleteFromCloudinary, getPublicIdFromUrl, uploadToCloudinary } from "../../config/cloudinary.config";
import { Prisma } from "../../../generated/prisma/client";
import { QueryHelper } from "../../builder/QueryBuilder";



const createTutorProfile = async (
  user: IRequestUser,
  payload: ICreateTutorProfile
) => {
  // Check if role is allowed
  if (user.role !== "STUDENT") {
    throw new AppError(
      status.FORBIDDEN,
      "Only students can create a tutor profile."
    );
  }

  // Check if profile already exists
  const existing = await prisma.tutorProfile.findUnique({
    where: { userId: user.userId },
  });

  if (existing) {
    throw new AppError(
      status.CONFLICT,
      "Tutor profile already exists. Use the update endpoint."
    );
  }

  if (payload.hourlyRate <= 0) {
    throw new AppError(status.BAD_REQUEST, "Hourly rate must be greater than 0.");
  }

  if (!payload.subjects || !payload.subjects.length) {
    throw new AppError(status.BAD_REQUEST, "At least one subject is required.");
  }

  if (!payload.languages || !payload.languages.length) {
    throw new AppError(status.BAD_REQUEST, "At least one language is required.");
  }

  const profile = await prisma.tutorProfile.create({
    data: {
      userId: user.userId,
      bio: payload.bio,
      hourlyRate: payload.hourlyRate,
      subjects: {
        create: payload.subjects.map((id: string) => ({
          subject: {
            connect: { id }
          }
        }))
      },
      languages: {
        create: payload.languages.map((id: string) => ({
          language: {
            connect: { id }
          }
        }))
      },
      experienceYears: payload.experienceYrs ?? 0,
      averageRating: 0,
      totalReviews: 0,
      isApproved: false,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
      subjects: true,
      languages: true,
    },
  });

  // If role is STUDENT, update to TUTOR
  if (user.role === "STUDENT") {
    await prisma.user.update({
      where: { id: user.userId },
      data: { role: "TUTOR" },
    });
  }

  return profile;
};

// ─────────────────────────────────────────────────────────────
//  UPDATE TUTOR PROFILE
// ─────────────────────────────────────────────────────────────

const updateTutorProfile = async (
  user: IRequestUser,
  payload: IUpdateTutorProfile
) => {
  const profile = await getMyProfile(user);

  if (payload.hourlyRate !== undefined && payload.hourlyRate <= 0) {
    throw new AppError(status.BAD_REQUEST, "Hourly rate must be greater than 0.");
  }

  if (payload.subjects !== undefined && !payload.subjects.length) {
    throw new AppError(status.BAD_REQUEST, "At least one subject is required.");
  }

  if (payload.languages !== undefined && !payload.languages.length) {
    throw new AppError(status.BAD_REQUEST, "At least one language is required.");
  }

  const updated = await prisma.tutorProfile.update({
    where: { id: profile.id },
    data: {
      ...(payload.bio !== undefined && { bio: payload.bio }),
      ...(payload.hourlyRate !== undefined && { hourlyRate: payload.hourlyRate }),
      ...(payload.experienceYears !== undefined && { experienceYears: payload.experienceYears }),
     
      // Relational updates for subjects
      ...(payload.subjects !== undefined && {
        subjects: {
          deleteMany: {},
          create: payload.subjects.map((id: string) => ({
            subject: { connect: { id } }
          }))
        }
      }),

      // Relational updates for languages
      ...(payload.languages !== undefined && {
        languages: {
          deleteMany: {},
          create: payload.languages.map((id: string) => ({
            language: { connect: { id } }
          }))
        }
      }),
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
  });

  return updated;
};

// ─────────────────────────────────────────────────────────────
//  UPLOAD AVATAR
// ─────────────────────────────────────────────────────────────

const uploadAvatar = async (user: IRequestUser, fileBuffer: Buffer, mimetype: string) => {
  const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
  if (!dbUser) throw new AppError(status.NOT_FOUND, "User not found.");

  // Delete old avatar from Cloudinary if it exists
  if (dbUser.image) {
    const publicId = getPublicIdFromUrl(dbUser.image);
    await deleteFromCloudinary(publicId, "image").catch(() => null); // non-blocking
  }

  const { url } = await uploadToCloudinary(fileBuffer, "tutorbyte/avatars", {
    transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
    format: "webp",
  });

  await prisma.user.update({
    where: { id: user.userId },
    data: { image: url },
  });

  return { avatarUrl: url };
};


// ─────────────────────────────────────────────────────────────
//  GET ALL TUTORS
// ─────────────────────────────────────────────────────────────

const getAllTutors = async (query: Record<string, any>) => {

 const searchTerm = (query.searchTerm || query.search) as string;

  const searchConditions = searchTerm ? {
    OR: [
      { user: { name: { contains: query.search, mode: 'insensitive' as Prisma.QueryMode } } },
      { bio: { contains: query.search, mode: 'insensitive' as Prisma.QueryMode } }
    ]
  } : {};

  const filterConditions = QueryHelper.filter(query);

  const { skip, take, page, limit, orderBy } = QueryHelper.paginateAndSort(query);

  const where: Prisma.TutorProfileWhereInput = {
    isApproved: true, 
    ...searchConditions,
    ...filterConditions,
  };

const total = await prisma.tutorProfile.count({ where });

  const tutors = await prisma.tutorProfile.findMany({
    where,
    skip,
    take,
    orderBy,
    include: {
      user: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
      subjects: {
        select: {
          subject: {
            select: { id: true, name: true }
          }
        },
      },
      languages: {
        select: {
          language: {
            select: { id: true, name: true }
          }
        },
      },
      availabilities: {
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }, {endTime: "asc"}],
      },
      reviews: {
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          student: {
            select: { id: true, name: true, image: true },
          },
        },
      },
      _count: {
        select: { reviews: true, bookings: true, subjects: true, languages: true },
      },
    },
  });
  return {
    tutors,
    meta: {
      page,
      limit,
      total
    },
  };
};

// ─────────────────────────────────────────────────────────────
//  GET PUBLIC TUTOR PROFILE (by tutor profile id)
// ─────────────────────────────────────────────────────────────

const getPublicProfile = async (tutorProfileId: string) => {
  const profile = await prisma.tutorProfile.findUnique({
    where: { id: tutorProfileId, isApproved: true },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          email: true,
        },
      },

      subjects: {
        select: {
          subject: {
            select: { id: true, name: true }
          }
        }
      },

      languages: {
        select: {
          language: {
            select: { id: true, name: true }
          }
        }
      },
      availabilities: {
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      },
      reviews: {
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          student: {
            select: { id: true, name: true, image: true }, // ইমেজও ইনক্লুড করা ভালো
          },
        },
      },
      _count: {
        select: { reviews: true, bookings: true },
      },
    },
  });

  if (!profile) {
    throw new AppError(
      status.NOT_FOUND,
      "Tutor profile not found or not yet approved."
    );
  }

  return profile;
};


// ─────────────────────────────────────────────────────────────
//  GET MY PROFILE  (tutor's own full view)
// ─────────────────────────────────────────────────────────────

const getMyProfile = async (user: IRequestUser) => {
  const profile = await prisma.tutorProfile.findUnique({
    where: { userId: user.userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          createdAt: true,
        },
      },
      availabilities: {
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      },
      reviews: {
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          student: {
            select: { id: true, name: true },
          },
        },
      },
      _count: {
        select: {
          bookings: true,
          reviews: true,
        },
      },
    },
  });

  if (!profile) {
    throw new AppError(
      status.NOT_FOUND,
      "Tutor profile not found. Please create your profile first."
    );
  }

  return profile;
};


// ─────────────────────────────────────────────────────────────
//  TUTOR DASHBOARD STATS
// ─────────────────────────────────────────────────────────────

const getDashboardStats = async (userId: string) => {
  const tutor = await prisma.tutorProfile.findUnique({
    where: { userId },
  });

  if (!tutor) {
    throw new AppError(status.NOT_FOUND, "Tutor profile not found!");
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  // আপনার এরর অনুযায়ী startTime যদি String হয়, তবে ISO string ব্যবহার করতে হবে
  const currentTimeString = now.toISOString();

  const [
    totalBookings,
    completedBookings,
    pendingBookings,
    monthBookings,
    lastMonthBookings,
    totalEarningsResult,
    monthEarningsResult,
    recentReviews,
    upcomingBookings,
  ] = await prisma.$transaction([
    // 1. Total bookings
    prisma.booking.count({ where: { tutorId: tutor.id } }),

    // 2. Completed sessions
    prisma.booking.count({ where: { tutorId: tutor.id, status: "COMPLETED" } }),

    // 3. Pending approval
    prisma.booking.count({ where: { tutorId: tutor.id, status: "PENDING" } }),

    // 4. This month's bookings
    prisma.booking.count({
      where: { tutorId: tutor.id, createdAt: { gte: startOfMonth } },
    }),

    // 5. Last month's bookings
    prisma.booking.count({
      where: { tutorId: tutor.id, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
    }),

    // 6. Total earnings
    prisma.payment.aggregate({
      where: { booking: { tutorId: tutor.id }, status: "PAID" },
      _sum: { amount: true }
    }),

    // 7. This month's earnings
    prisma.payment.aggregate({
      where: { 
        booking: { tutorId: tutor.id }, 
        status: "PAID",
        createdAt: { gte: startOfMonth }
      },
      _sum: { amount: true }
    }),

    // 8. Latest 5 reviews
    prisma.review.findMany({
      where: { tutorId: tutor.id },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { student: { select: { id: true, name: true, image: true } } },
    }),

    // 9. Upcoming sessions (Fixing the Type Error here)
    prisma.booking.findMany({
      where: {
        tutorId: tutor.id,
        status: "ACCEPTED",
        // যদি startTime ফিল্ডটি String হয়, তবে currentTimeString দিন। 
        // যদি DateTime হয় তবে সরাসরি 'now' ব্যবহার করুন।
        startTime: { gte: currentTimeString } 
      },
      take: 5,
      orderBy: { startTime: "asc" },
      include: {
        student: { select: { id: true, name: true, image: true } },
        payment: { select: { status: true, amount: true } },
      },
    }),
  ]);

  // % Change calculation logic
  const bookingChange = lastMonthBookings === 0
    ? (monthBookings > 0 ? 100 : 0)
    : Math.round(((monthBookings - lastMonthBookings) / lastMonthBookings) * 100);

  return {
    overview: {
      totalBookings,
      completedBookings,
      pendingBookings,
      totalEarnings: totalEarningsResult._sum.amount || 0,
      monthEarnings: monthEarningsResult._sum.amount || 0,
      averageRating: tutor.averageRating || 0,
      totalReviews: tutor.totalReviews || 0,
      isApproved: tutor.isApproved,
    },
    activity: {
      thisMonthBookings: monthBookings,
      lastMonthBookings,
      bookingChangePercent: bookingChange,
    },
    recentReviews,
    upcomingBookings,
  };
};

export const TutorServices = {
  createTutorProfile,
  updateTutorProfile,
  uploadAvatar,
  getMyProfile,
  getAllTutors,
  getPublicProfile,
  getDashboardStats,
}