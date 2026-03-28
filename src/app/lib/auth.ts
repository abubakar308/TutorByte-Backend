import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { envVars } from "../config/env";
import { UserRole, UserStatus } from "../../generated/prisma/enums";
import { bearer, emailOTP } from "better-auth/plugins";

export const auth = betterAuth({
    baseURL: envVars.BETTER_AUTH_URL,
    secret: envVars.BETTER_AUTH_SECRET,
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),

    emailAndPassword: {
        enabled: true,
    },

    emailVerification: {
        enabled: true,
        sendVerificationEmail: async ({ url, user }) => {
            console.log("Verification email sent to:", user.email);
            console.log("Verification URL:", url);
        },
    },

    // passwordReset: {
    //     enabled: true,
    //     sendResetPasswordEmail: async ({ url, user }) => {
    //         console.log("Reset password email sent to:", user.email);
    //         console.log("Reset password URL:", url);
    //     },
    // },

    // passwordChange: {
    //     enabled: true,
    //     sendPasswordChangeEmail: async ({ url, user }) => {
    //         console.log("Password change email sent to:", user.email);
    //         console.log("Password change URL:", url);
    //     },
    // },

    user: {
        additionalFields: {
            role: {
                type: "string",
                required: true,
                defaultValue: UserRole.STUDENT
            },

            status: {
                type: "string",
                required: true,
                defaultValue: UserStatus.ACTIVE
            },

            needPasswordChange: {
                type: "boolean",
                required: true,
                defaultValue: false
            },

            isDeleted: {
                type: "boolean",
                required: true,
                defaultValue: false
            },

            deletedAt: {
                type: "date",
                required: false,
                defaultValue: null
            },
        }
    },

    // plugins: [
    //     bearer(),
    //     emailOTP({
    //         overrideDefaultEmailVerification: true,
    //         async sendVerificationOTP({ email, otp, type }) {
    //             if (type === "email-verification") {
    //                 const user = await prisma.user.findUnique({
    //                     where: {
    //                         email,
    //                     }
    //                 })

    //                 if (user && !user.emailVerified) {
    //                        await sendEmail({
    //                             to : email,
    //                             subject : "Verify your email",
    //                             templateName : "otp",
    //                             templateData :{
    //                                 name : user.name,
    //                                 otp,
    //                             }
    //                         });
    //                 }
    //             } else if (type === "forget-password") {
    //                 const user = await prisma.user.findUnique({
    //                     where: {
    //                         email,
    //                     }
    //                 })

    //                 if (user) {
    //                     await sendEmail({
    //                         to: email,
    //                         subject: "Password Reset OTP",
    //                         templateName: "otp",
    //                         templateData: {
    //                             name: user.name,
    //                             otp,
    //                         }
    //                     })
    //                 }
    //             }
    //         },
    //         expiresIn: 2 * 60, // 2 minutes in seconds
    //         otpLength: 6,
    //     })
    // ],

    session: {
        expiresIn: 60 * 60 * 60 * 24, // 1 day in seconds
        updateAge: 60 * 60 * 60 * 24, // 1 day in seconds
        cookieCache: {
            enabled: true,
            maxAge: 60 * 60 * 60 * 24, // 1 day in seconds
        }
    },

    
});