import status from "http-status";
import AppError from "../../errorHelper/AppError";
import { auth } from "../../lib/auth";
import { ILoginUserPayload } from "./auth.interface";
import { UserStatus } from "../../../generated/prisma/enums";

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

    //  const accessToken = tokenUtils.getAccessToken({
    //     userId: data.user.id,
    //     role: data.user.role,
    //     name: data.user.name,
    //     email: data.user.email,
    //     status: data.user.status,
    //     isDeleted: data.user.isDeleted,
    //     emailVerified: data.user.emailVerified,
    // });

    // const refreshToken = tokenUtils.getRefreshToken({
    //     userId: data.user.id,
    //     role: data.user.role,
    //     name: data.user.name,
    //     email: data.user.email,
    //     status: data.user.status,
    //     isDeleted: data.user.isDeleted,
    //     emailVerified: data.user.emailVerified,
    // });
    
    return {
        ...data,
        // accessToken,
        // refreshToken
    }

};

export const AuthServices = {
    registerStudent,
    loginStudent
}