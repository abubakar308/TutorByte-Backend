import status from "http-status";
import AppError from "../../errorHelper/AppError";
import { auth } from "../../lib/auth";
import { ILoginUserPayload, IRequestUser } from "./auth.interface";
import { prisma } from "../../lib/prisma";
import { tokenUtils } from "../../utils/token";

interface IRegisterStudentPayload {
    name: string;
    email: string;
    password: string;
}


const registerStudent = async (payload: IRegisterStudentPayload) => {
    const { name, email, password } = payload;

    const data = await auth.api.signUpEmail({
        body: {
            name,
            email,
            password,
        }
    })

    if (!data.user) {
        throw new AppError(status.BAD_REQUEST, "Failed to register student");
    }

    // Since a Student is just a User with a STUDENT role, and there is no separate StudentProfile
    // model in the schema, we don't need a transaction to create a profile.
    return {
        ...data,
        student: data.user
    }
}


const loginStudent = async (payload: ILoginUserPayload) => {
    const { email, password } = payload;

    const data = await auth.api.signInEmail({
        body: {
            email,
            password
        }
    })


//  if (data.user.status === UserStatus.BLOCKED) {
//         throw new AppError(status.FORBIDDEN, "User is blocked");
//     }

    //    if (data.user.isDeleted || data.user.status === UserStatus.DELETED) {
    //     throw new AppError(status.NOT_FOUND, "User is deleted");
    // }

    if (!data.user) {
        throw new Error("Failed to login patient");
    }

     const accessToken = tokenUtils.getAccessToken({
        userId: data.user.id,
        role: data.user.role,
        name: data.user.name,
        email: data.user.email,
        status: data.user.status,
        isDeleted: data.user.isDeleted,
        emailVerified: data.user.emailVerified,
    });

    const refreshToken = tokenUtils.getRefreshToken({
        userId: data.user.id,
        role: data.user.role,
        name: data.user.name,
        email: data.user.email,
        status: data.user.status,
        isDeleted: data.user.isDeleted,
        emailVerified: data.user.emailVerified,
    });
    
    return {
        ...data,
        accessToken,
        refreshToken
    }

};

// const getMe = async (user: IRequestUser) => {
//   const userData = await prisma.user.findUnique({
//     where: {
//       id: user.userId,
//     },
//     select: {
//       id: true,
//       name: true,
//       email: true,
//       role: true,
//       createdAt: true,

//       tutorProfile: {
//         select: {
//           id: true,
//           bio: true,
//           hourlyRate: true,
//           isApproved: true,
//         },
//       },
//     },
//   });

//   if (!userData) {
//     throw new AppError(status.NOT_FOUND, "User does not exist");
//   }

//   return userData;
// };


const getMe = async (user: IRequestUser) => {
  const userData = await prisma.user.findUnique({
    where: { id: user.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      image: true,
      isVerified: true,
      status: true,
      createdAt: true,
      tutorProfile: {
        select: {
          id: true,
          bio: true,
          hourlyRate: true,
          isApproved: true,
        },
      },
    },
  });
 
  if (!userData) {
    throw new AppError(status.NOT_FOUND, "User does not exist.");
  }
 
  return userData;
};

export const AuthServices = {
    registerStudent,
    loginStudent,
    getMe
}