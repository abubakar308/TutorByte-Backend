import { UserRole } from "../../generated/prisma/enums";
import { envVars } from "../config/env";
import { auth } from "../lib/auth";
import { prisma } from "../lib/prisma";

const seedAdmin = async () => {
    try {
        const adminUser = await prisma.user.findFirst({
            where: {
                role: UserRole.ADMIN,
            },
        });

        if (!adminUser) {
            console.log("Seeding admin...");
            const existingUser = await prisma.user.findUnique({
                where: {
                    email: envVars.SUPER_ADMIN_EMAIL,
                },
            });

            if (existingUser) {
                await prisma.user.update({
                    where: {
                        id: existingUser.id,
                    },
                    data: {
                        role: UserRole.ADMIN,
                        emailVerified: true,
                        isVerified: true
                    },
                });
                console.log("Existing user role updated to Admin.");
            } else {
                const data = await auth.api.signUpEmail({
                    body: {
                        name: "Super Admin",
                        email: envVars.SUPER_ADMIN_EMAIL,
                        password: envVars.SUPER_ADMIN_PASSWORD,
                    },
                });

                if (data?.user) {
                    await prisma.user.update({
                        where: {
                            id: data.user.id,
                        },
                        data: {
                            role: UserRole.ADMIN,
                            emailVerified: true,
                            isVerified: true
                        },
                    });
                    console.log("Admin seeded successfully.");
                }
            }
        } else {
            console.log("Admin already exists.");
        }
    } catch (error) {
        console.error("Error seeding admin:", error);
    }
};

export default seedAdmin;
