import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { Request, Response } from "express";
import { sendResponse } from "../../shared/sendResponse";
import { AuthServices } from "./auth.service";



const registerStudent = catchAsync(
    async (req: Request, res: Response) => {
        // const maxAge = ms(envVars.ACCESS_TOKEN_EXPIRES_IN as StringValue);
        // console.log({ maxAge });
        const payload = req.body;

        console.log(payload);

        const result = await AuthServices.registerStudent(payload);

        const { token, ...rest } = result

        // tokenUtils.setAccessTokenCookie(res, accessToken);
        // tokenUtils.setRefreshTokenCookie(res, refreshToken);
        // tokenUtils.setBetterAuthSessionCookie(res, token as string);

        sendResponse(res, {
            httpStatusCode: status.CREATED,
            success: true,
            message: "Student registered successfully",
            data: {
                token,
                // accessToken,
                // refreshToken,
                ...rest,
            }
        })
    }
    
)


const loginStudent = catchAsync(
    async (req: Request, res: Response) => {
        const payload = req.body;

        const result = await AuthServices.loginStudent(payload);

         const { accessToken, refreshToken, token, ...rest } = result

        // tokenUtils.setAccessTokenCookie(res, accessToken);
        // tokenUtils.setRefreshTokenCookie(res, refreshToken);
        // tokenUtils.setBetterAuthSessionCookie(res, token);

        sendResponse(res, {
            httpStatusCode: 201,
            success: true,
            message: "Patient login successfully",
            data: {
                token,
                accessToken,
                refreshToken,
                ...rest,
            }
        })
    }
)


export const AuthController = {
    registerStudent,
    loginStudent

}