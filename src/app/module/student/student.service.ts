import { prisma } from "../../lib/prisma";
import { IRequestUser } from "../auth/auth.interface";
import { deleteFromCloudinary, getPublicIdFromUrl, uploadToCloudinary } from "../../config/cloudinary.config";


const getStudentDashboardStatsFromDB = async (userId: string) => {
  // নিশ্চিত করা যে userId খালি নয়
  if (!userId) {
    throw new Error("User ID is required!");
  }

  // ১. ইউজার আছে কিনা চেক করা (ঐচ্ছিক কিন্তু নিরাপদ)
  const user = await prisma.user.findUnique({
    where: { id: userId, isDeleted: false },
  });

  if (!user) {
    throw new Error("User not found!");
  }

  // ২. বুকিং ও পেমেন্ট ডাটা আনা (সরাসরি userId ব্যবহার করে)
  const [completedSessions, payments, reviews] = await prisma.$transaction([
    prisma.booking.findMany({
      where: { 
        studentId: userId, // আপনার রিলেশনে studentId হিসেবে User ID ব্যবহার হচ্ছে
        status: "COMPLETED" 
      },
      select: { startTime: true, endTime: true }
    }),
    prisma.payment.aggregate({
      where: { 
        booking: { studentId: userId }, 
        status: "PAID" 
      },
      _sum: { amount: true }
    }),
    prisma.review.aggregate({
      where: { studentId: userId },
      _avg: { rating: true }
    })
  ]);

  // ৩. Hours Learned ক্যালকুলেট করা
  let totalMinutes = 0;
  completedSessions.forEach(session => {
    try {
      const [startH, startM] = session.startTime.split(':').map(Number);
      const [endH, endM] = session.endTime.split(':').map(Number);
      // মিনিট ক্যালকুলেশন (সহজ পদ্ধতি)
      totalMinutes += (endH * 60 + endM) - (startH * 60 + startM);
    } catch (e) {
      console.error("Time parsing error:", e);
    }
  });

  return {
    totalSessions: completedSessions.length,
    hoursLearned: `${Math.max(0, Math.floor(totalMinutes / 60))}h`,
    totalInvested: payments._sum.amount || 0,
    avgRating: Number((reviews._avg.rating || 0).toFixed(1))
  };
};

const updateProfileInDB = async (userId: string, payload: any) => {
  return await prisma.user.update({
    where: { id: userId },
    data: payload,
    select: { id: true, name: true, image: true, email: true }
  });
};

const uploadAvatar = async (user: IRequestUser, fileBuffer: Buffer, mimetype: string) => {
  const dbUser = await prisma.user.findUnique({ where: { id: user.userId } });
  if (!dbUser) throw new Error("User not found.");

  // Delete old avatar from Cloudinary if it exists
  if (dbUser.image) {
    const publicId = getPublicIdFromUrl(dbUser.image);
    if (publicId) {
      await deleteFromCloudinary(publicId, "image").catch(() => null);
    }
  }

  const { url } = await uploadToCloudinary(fileBuffer, "tutorbyte/avatars", {
    transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
    format: "webp",
  });

  return await prisma.user.update({
    where: { id: user.userId },
    data: { image: url },
    select: { id: true, name: true, image: true, email: true }
  });
};

export const UserService = {
  getStudentDashboardStatsFromDB,
  updateProfileInDB,
  uploadAvatar,
};