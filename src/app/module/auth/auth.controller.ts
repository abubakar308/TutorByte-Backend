import status from "http-status";
import { catchAsync } from "../../shared/catchAsync";
import { Request, Response } from "express";
import { sendResponse } from "../../shared/sendResponse";
import { AuthServices } from "./auth.service";
import { IRequestUser } from "./auth.interface";
import { tokenUtils } from "../../utils/token";



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

        tokenUtils.setAccessTokenCookie(res, accessToken);
        tokenUtils.setRefreshTokenCookie(res, refreshToken);
        tokenUtils.setBetterAuthSessionCookie(res, token);

        sendResponse(res, {
            httpStatusCode: 201,
            success: true,
            message: "User login successfully",
            data: {
                token,
                accessToken,
                refreshToken,
                ...rest,
            }
        })
    }
)


// const getMe = catchAsync(
//     async (req: Request, res: Response) => {
//         const user = req.user;

//         const result = await AuthServices.getMe(user as IRequestUser);

//         sendResponse(res, {
//             httpStatusCode: status.OK,
//             success: true,
//             message: "User fetched successfully",
//             data: result
//         })
//     }
// )

const getMe = catchAsync(async (req: Request, res: Response) => {
    const result = await AuthServices.getMe(req.user as IRequestUser);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Profile fetched successfully.",
        data: result,
    });
});


export const AuthController = {
    registerStudent,
    loginStudent,
    getMe

}