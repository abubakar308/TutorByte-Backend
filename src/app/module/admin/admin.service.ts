import { prisma } from "../../lib/prisma";
import { UserRole, UserStatus } from "../../../generated/prisma/enums";
import { auth } from "../../lib/auth";
import status from "http-status";
import AppError from "../../errorHelper/AppError";
import { QueryHelper } from "../../builder/QueryBuilder";

const getAllUsers = async (query: any) => {
  // ১. সার্চেবল ফিল্ডগুলো ডিফাইন করুন
  const searchableFields = ["name", "email"];

  // ২. সার্চ লজিক অ্যাপ্লাই করুন
  const searchConditions = QueryHelper.search(query.searchTerm, searchableFields);

  // ৩. ফিল্টার লজিক (role, status ইত্যাদি)
  const filterConditions = QueryHelper.filter(query);

  // ৪. প্যাজিনেশন এবং সর্টিং লজিক
  const { skip, take, page, limit, orderBy } = QueryHelper.paginateAndSort(query);

  // ৫. সবগুলো কন্ডিশন একসাথে করা (Combine All)
  const where = {
    ...searchConditions,
    ...filterConditions,
  };

  // ৬. ডাটাবেস কোয়েরি
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        tutorProfile: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: users,
  };
};

const updateUserStatus = async (userId: string, status: UserStatus, adminId: string) => {
  const result = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: {
        id: userId,
      },
      data: {
        status,
      },
    });

    await tx.adminLog.create({
      data: {
        adminId,
        action: `Updated user status of ${userId} to ${status}`,
      },
    });

    return updatedUser;
  });
  
  return result;
};

const updateUserRole = async (userId: string, role: UserRole, adminId: string) => {
  const result = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: {
        id: userId,
      },
      data: {
        role,
      },
    });

    await tx.adminLog.create({
      data: {
        adminId,
        action: `Updated user role of ${userId} to ${role}`,
      },
    });

    return updatedUser;
  });
  
  return result;
};

const getDashboardStats = async () => {
  const totalUsers = await prisma.user.count();
  const totalTutors = await prisma.user.count({ where: { role: UserRole.TUTOR } });
  const totalStudents = await prisma.user.count({ where: { role: UserRole.STUDENT } });
  const totalBookings = await prisma.booking.count();
  const averageRating = await prisma.tutorProfile.aggregate({
    _avg: {
      averageRating: true,
    },
  });
  const totalRevenue = await prisma.payment.aggregate({
    _sum: {
      amount: true,
    },
  });
  
  // You could also add revenue calculations here if Payment model is ready
  
  return {
    totalUsers,
    totalTutors,
    totalStudents,
    totalBookings,
    averageRating,
    totalRevenue: totalRevenue._sum.amount || 0,
  };
};

const getAdminLogs = async () => {
  const result = await prisma.adminLog.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      admin: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });
  return result;
};

const createAdmin = async (payload: any, adminId: string) => {
  const { name, email, password } = payload;

  const data = await auth.api.signUpEmail({
    body: {
      name,
      email,
      password,
    },
  });

  if (!data.user) {
    throw new AppError(status.BAD_REQUEST, "Failed to create admin user");
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: {
        id: data.user.id,
      },
      data: {
        role: UserRole.ADMIN,
      },
    });

    await tx.adminLog.create({
      data: {
        adminId,
        action: `Created new admin: ${email}`,
      },
    });

    return updatedUser;
  });

  return result;
};

const deleteUser = async (userId: string, adminId: string) => {
  const result = await prisma.$transaction(async (tx) => {
    // Delete related data first or rely on Cascade if configured
    // In this schema, we might need to be careful.
    
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new AppError(status.NOT_FOUND, "User not found");
    }

    const deletedUser = await tx.user.update({
      where: {
        id: userId,
      },
      data: {
        isDeleted: true,
        status: UserStatus.BLOCKED,
      },
    });

    await tx.adminLog.create({
      data: {
        adminId,
        action: `Deleted user: ${user.email} (${userId})`,
      },
    });

    return deletedUser;
  });

  return result;
};

const approveTutor = async (userId: string, adminId: string) => {
  const result = await prisma.$transaction(async (tx) => {
    // Check if user exists and is a tutor
    const user = await tx.user.findUnique({
      where: { id: userId },
      include: { tutorProfile: true },
    });

    if (!user) {
      throw new AppError(status.NOT_FOUND, "Tutor not found");
    }

    if (user.role !== UserRole.TUTOR) {
      throw new AppError(status.BAD_REQUEST, "User is not a tutor");
    }

    if (!user.tutorProfile) {
      throw new AppError(status.BAD_REQUEST, "Tutor profile not found");
    }

    // Approve the tutor
    await tx.tutorProfile.update({
      where: { userId: userId },
      data: { isApproved: true },
    });

    await tx.adminLog.create({
      data: {
        adminId,
        action: `Approved tutor: ${user.email} (${user.id})`,
      },
    });

    return { message: "Tutor approved successfully" };
  });

  return result;
};

const rejectTutor = async (userId: string, adminId: string) => {
  const result = await prisma.$transaction(async (tx) => {
    // Check if user exists and is a tutor
    const user = await tx.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(status.NOT_FOUND, "Tutor not found");
    }

    if (user.role !== UserRole.TUTOR) {
      throw new AppError(status.BAD_REQUEST, "User is not a tutor");
    }

    // Update role to student
    await tx.user.update({
      where: { id: userId },
      data: { role: UserRole.STUDENT },
    });

    await tx.adminLog.create({
      data: {
        adminId,
        action: `Rejected tutor and changed role to student: ${user.email} (${user.id})`,
      },
    });

    return { message: "Tutor rejected and role updated to student" };
  });

  return result;
};

export const AdminService = {
  getAllUsers,
  updateUserStatus,
  updateUserRole,
  getDashboardStats,
  getAdminLogs,
  createAdmin,
  deleteUser,
  approveTutor,
  rejectTutor,
};
