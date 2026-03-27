import status from "http-status";

import {
  ICreateTutorProfile,
  ISetAvailabilityPayload,
  ITutorSearchQuery,
  IUpdateTutorProfile,
} from "./tutor.interface";
import { IRequestUser } from "../auth/auth.interface";
import AppError from "../../errorHelper/AppError";
import { prisma } from "../../lib/prisma";
import { deleteFromCloudinary, getPublicIdFromUrl, uploadToCloudinary } from "../../config/cloudinary.config";
import { Prisma } from "../../../generated/prisma/client";

const createTutorProfile = async (
  user: IRequestUser,
  payload: ICreateTutorProfile
) => {
  // Only TUTOR role can create a profile
  if (user.role !== "STUDENT") {
    throw new AppError(
      status.FORBIDDEN,
      "Only tutors can create a tutor profile."
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

  if (!payload.subjects.length) {
    throw new AppError(status.BAD_REQUEST, "At least one subject is required.");
  }

  if (!payload.languages.length) {
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
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
  });

  // Sync to search index
  // await syncSearchIndex(profile.id);

  return profile;
};

// ─────────────────────────────────────────────────────────────
//  UPDATE TUTOR PROFILE
// ─────────────────────────────────────────────────────────────

const updateTutorProfile = async (
  user: IRequestUser,
  payload: IUpdateTutorProfile
) => {
  const profile = await getOwnProfile(user.userId);

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
      ...(payload.subjects !== undefined && { subjects: payload.subjects }),
      ...(payload.languages !== undefined && { languages: payload.languages }),
      ...(payload.experienceYrs !== undefined && { experienceYears: payload.experienceYrs }),
      ...(payload.education !== undefined && { education: payload.education }),
      ...(payload.timezone !== undefined && { timezone: payload.timezone }),
      ...(payload.introVideoUrl !== undefined && { introVideoUrl: payload.introVideoUrl }),
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
    },
  });

  // await syncSearchIndex(updated.id);

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


const setAvailability = async (
  user: IRequestUser,
  payload: ISetAvailabilityPayload
) => {
  const profile = await getOwnProfile(user.userId);

  // Validate slots
  for (const slot of payload.slots) {
    if (slot.dayOfWeek < 0 || slot.dayOfWeek > 6) {
      throw new AppError(
        status.BAD_REQUEST,
        `Invalid dayOfWeek: ${slot.dayOfWeek}. Must be 0 (Sun) to 6 (Sat).`
      );
    }

    if (!isValidTime(slot.startTime) || !isValidTime(slot.endTime)) {
      throw new AppError(
        status.BAD_REQUEST,
        `Invalid time format in slot. Use "HH:MM" (24-hour).`
      );
    }

    if (slot.startTime >= slot.endTime) {
      throw new AppError(
        status.BAD_REQUEST,
        `startTime must be before endTime in each slot.`
      );
    }
  }

  // Check for overlapping slots on the same day
  checkSlotOverlaps(payload.slots);

  // Full replace — delete all existing slots then re-create
  await prisma.$transaction([
    prisma.availability.deleteMany({ where: { tutorId: profile.id } }),
    prisma.availability.createMany({
      data: payload.slots.map((slot) => ({
        tutorId: profile.id,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isRecurring: slot.isRecurring ?? true,
        specificDate: slot.specificDate ? new Date(slot.specificDate) : null,
      })),
    }),
  ]);

  const slots = await prisma.availability.findMany({
    where: { tutorId: profile.id },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return slots;
};

// ─────────────────────────────────────────────────────────────
//  GET OWN AVAILABILITY
// ─────────────────────────────────────────────────────────────

const getMyAvailability = async (user: IRequestUser) => {
  const profile = await getOwnProfile(user.userId);

  const slots = await prisma.availability.findMany({
    where: { tutorId: profile.id },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  // Group by day for easier frontend consumption
  const grouped = Array.from({ length: 7 }, (_, i) => ({
    dayOfWeek: i,
    dayName: ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][i],
    slots: slots.filter((s) => s.dayOfWeek === i),
  }));

  return grouped;
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
            select: { id: true, name: true},
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
//  GET PUBLIC TUTOR PROFILE  (by tutor profile id)
// ─────────────────────────────────────────────────────────────

const getPublicProfile = async (tutorProfileId: string) => {
  const profile = await prisma.tutorProfile.findUnique({
    where: { id: tutorProfileId, isApproved: true },
    include: {
      user: {
        select: {
          id: true,
          name: true
        },
      },
      availabilities: {
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      },
      reviews: {
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          student: {
            select: { id: true, name: true },
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
//  SEARCH TUTORS  (the interview-winning feature)
// ─────────────────────────────────────────────────────────────

const searchTutors = async (query: ITutorSearchQuery) => {
  const {
    subject,
    language,
    minPrice,
    maxPrice,
    minRating,
    search,
    sortBy = "rating",
    page = 1,
    limit = 10,
  } = query;

  const skip = (page - 1) * limit;
  const take = Math.min(limit, 50); // cap at 50 per page

  // Build Prisma where clause dynamically
  const where: Prisma.TutorProfileWhereInput = {
    isApproved: true,
    user: { status: "ACTIVE" },

    // Subject filter — checks if the subjects array contains the value
    ...(subject && {
      subjects: { has: subject },
    }),

    // Language filter
    ...(language && {
      languages: { has: language },
    }),

    // Price range
    ...(minPrice !== undefined || maxPrice !== undefined
      ? {
          hourlyRate: {
            ...(minPrice !== undefined && { gte: minPrice }),
            ...(maxPrice !== undefined && { lte: maxPrice }),
          },
        }
      : {}),

    // Minimum rating
    ...(minRating !== undefined && {
      averageRating: { gte: minRating },
    }),

    // Full-text search on bio and headline (PostgreSQL ILIKE)
    ...(search && {
      OR: [
        { bio: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
      ],
    }),
  };

  // Sort options
  const orderBy: Prisma.TutorProfileOrderByWithRelationInput = (() => {
    switch (sortBy) {
      case "price_asc":  return { hourlyRate: "asc" };
      case "price_desc": return { hourlyRate: "desc" };
      case "reviews":    return { totalReviews: "desc" };
      default:           return { averageRating: "desc" };
    }
  })();

  // Run count + data query in parallel
  const [total, tutors] = await prisma.$transaction([
    prisma.tutorProfile.count({ where }),
    prisma.tutorProfile.findMany({
      where,
      orderBy,
      skip,
      take,
      select: {
        id: true,
        headline: true,
        bio: true,
        hourlyRate: true,
        subjects: true,
        languages: true,
        averageRating: true,
        totalReviews: true,
        experienceYears: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
  ]);

  return {
    tutors,
    meta: {
      total,
      page,
      limit: take,
      totalPages: Math.ceil(total / take),
      hasNextPage: skip + take < total,
      hasPrevPage: page > 1,
    },
  };
};

// ─────────────────────────────────────────────────────────────
//  TUTOR DASHBOARD STATS
// ─────────────────────────────────────────────────────────────

const getDashboardStats = async (user: IRequestUser) => {
  const profile = await getOwnProfile(user.userId);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    totalBookings,
    completedBookings,
    pendingBookings,
    monthBookings,
    lastMonthBookings,
    totalEarnings,
    monthEarnings,
    recentReviews,
    upcomingBookings,
  ] = await prisma.$transaction([
    // Total bookings ever
    prisma.booking.count({ where: { tutorId: profile.id } }),

    // Completed sessions
    prisma.booking.count({
      where: { tutorId: profile.id, status: "COMPLETED" },
    }),

    // Pending approval
    prisma.booking.count({
      where: { tutorId: profile.id, status: "PENDING" },
    }),

    // This month's bookings
    prisma.booking.count({
      where: {
        tutorId: profile.id,
        createdAt: { gte: startOfMonth },
      },
    }),

    // Last month's bookings (for % change)
    prisma.booking.count({
      where: {
        tutorId: profile.id,
        createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
    }),

    // Total earnings (sum of tutorEarnings on PAID payments)
    prisma.payment.aggregate({
      where: {
        booking: { tutorId: profile.id },
        status: "PAID",
      }
    }),

    // This month's earnings
    prisma.payment.aggregate({
      where: {
        booking: { tutorId: profile.id },
        status: "PAID",
      }
    }),

    // Latest 5 reviews
    prisma.review.findMany({
      where: { tutorId: profile.id },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        student: { select: { id: true, name: true } },
      },
    }),

    // Next 5 upcoming accepted sessions
    prisma.booking.findMany({
      where: {
        tutorId: profile.id,
        status: "ACCEPTED",
      
      },
      take: 5,
      include: {
        student: { select: { id: true, name: true } },
        payment: { select: { status: true, amount: true } },
      },
    }),
  ]);

  // Month-over-month booking change percentage
  const bookingChange =
    lastMonthBookings === 0
      ? 100
      : Math.round(
          ((monthBookings - lastMonthBookings) / lastMonthBookings) * 100
        );

  return {
    overview: {
      totalBookings,
      completedBookings,
      pendingBookings,
      averageRating: profile.averageRating,
      totalReviews: profile.totalReviews,
      isApproved: profile.isApproved,
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

// ─────────────────────────────────────────────────────────────
//  PRIVATE HELPERS
// ─────────────────────────────────────────────────────────────

/** Load the tutor's own profile — throws 404 if not found */


const getOwnProfile = async (userId: string) => {
  const profile = await prisma.tutorProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new AppError(
      status.NOT_FOUND,
      "Tutor profile not found. Please create your profile first."
    );
  }

  return profile;
};

/** "HH:MM" validation */
const isValidTime = (time: string): boolean =>
  /^([01]\d|2[0-3]):[0-5]\d$/.test(time);

/** Detect overlapping availability slots on the same day */
const checkSlotOverlaps = (slots: { dayOfWeek: number; startTime: string; endTime: string }[]) => {
  const byDay: Record<number, { startTime: string; endTime: string }[]> = {};

  for (const slot of slots) {
    if (!byDay[slot.dayOfWeek]) byDay[slot.dayOfWeek] = [];
    byDay[slot.dayOfWeek].push({ startTime: slot.startTime, endTime: slot.endTime });
  }

  for (const [day, daySlots] of Object.entries(byDay)) {
    const sorted = [...daySlots].sort((a, b) =>
      a.startTime.localeCompare(b.startTime)
    );

    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i].endTime > sorted[i + 1].startTime) {
        const dayName = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][Number(day)];
        throw new AppError(
          status.BAD_REQUEST,
          `Overlapping slots on ${dayName}: ${sorted[i].startTime}–${sorted[i].endTime} overlaps with ${sorted[i + 1].startTime}–${sorted[i + 1].endTime}`
        );
      }
    }
  }
};

/** Sync the TutorSearchIndex denormalized table after profile changes */
/*
const syncSearchIndex = async (tutorProfileId: string) => {
  const profile = await prisma.tutorProfile.findUnique({
    where: { id: tutorProfileId },
    include: { user: { select: { id: true } } },
  });

  if (!profile) return;

  const searchVector = [
    profile.bio,
    profile.headline,
    ...profile.subjects,
    ...profile.languages,
  ]
    .join(" ")
    .toLowerCase();

  await prisma.tutorSearchIndex.upsert({
    where: { id: tutorProfileId },
    create: {
      id: tutorProfileId,
      userId: profile.userId,
      searchVector,
      subjects: profile.subjects,
      languages: profile.languages,
      hourlyRate: profile.hourlyRate,
      averageRating: profile.averageRating,
      isApproved: profile.isApproved,
    },
    update: {
      searchVector,
      subjects: profile.subjects,
      languages: profile.languages,
      hourlyRate: profile.hourlyRate,
      averageRating: profile.averageRating,
      isApproved: profile.isApproved,
    },
  });
};
*/

// ─────────────────────────────────────────────────────────────
//  EXPORTS
// ─────────────────────────────────────────────────────────────

export const TutorServices = {
  createTutorProfile,
  updateTutorProfile,
  uploadAvatar,
  setAvailability,
  getMyAvailability,
  getMyProfile,
  getPublicProfile,
  searchTutors,
  getDashboardStats,
}