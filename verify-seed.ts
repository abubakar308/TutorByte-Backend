import "dotenv/config";
import { prisma } from "./src/app/lib/prisma";
import { UserRole } from "./src/generated/prisma/enums";

async function verify() {
    const admin = await prisma.user.findFirst({
        where: {
            role: UserRole.ADMIN
        }
    });
    if (admin) {
        console.log("Verification Successful: Admin found with email:", admin.email);
    } else {
        console.log("Verification Failed: No admin found.");
    }
    process.exit(0);
}

verify();
