import { auth } from "../../lib/auth";
import { prisma } from "../../lib/prisma";



interface IRegisterPatientPayload {
    name: string;
    email: string;
    password: string;
}

const registerPatient = async (payload: IRegisterPatientPayload) => {
    const { name, email, password } = payload;

    const data = await auth.api.signUpEmail({
        body: {
            name,
            email,
            password,
        }
    })

    if (!data.user) {
        // throw new Error("Failed to register patient");
        throw new AppError(status.BAD_REQUEST, "Failed to register patient");
    }

    //TODO : Create Patient Profile In Transaction After Sign Up Of Patient In USer Model
    try {
        const patient = await prisma.$transaction(async (tx) => {

            const patientTx = await tx.tutorProfile.create({
                data: {
                    userId: data.user.id,
                    name: payload.name,
                    email: payload.email,
                }
            })

            return patientTx
        })

        // const accessToken = tokenUtils.getAccessToken({
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
            // refreshToken,
            patient
        }

    } catch (error) {
        console.log("Transaction error : ", error);
        await prisma.user.delete({
            where: {
                id: data.user.id
            }
        })
        throw error;
    }

}