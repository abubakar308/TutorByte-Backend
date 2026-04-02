import cron from "node-cron";
import { prisma } from "../lib/prisma";
import { BookingStatus } from "../../generated/prisma/enums";

export const startCronJobs = () => {
  // Run every 10 minutes to check for completed bookings
  cron.schedule("*/10 * * * *", async () => {
    console.log("🕒 [Cron] Checking for completed bookings...");
    try {
      // Find all bookings that are currently ACCEPTED (meaning they are paid and scheduled)
      const activeBookings = await prisma.booking.findMany({
        where: {
          status: BookingStatus.ACCEPTED,
        },
      });

      const now = new Date();
      const idsToUpdate: string[] = [];

      for (const booking of activeBookings) {
        // Parse the endTime (e.g., "14:30")
        const [hours, minutes] = booking.endTime.split(":").map(Number);
        
        // Construct the local expiry time of the booking
        const bDate = new Date(booking.bookingDate);
        const localEndTime = new Date(
          bDate.getUTCFullYear(),
          bDate.getUTCMonth(),
          bDate.getUTCDate(),
          hours,
          minutes
        );

        // If the current time is greater than the end time of the booking
        if (now > localEndTime) {
          idsToUpdate.push(booking.id);
        }
      }

      if (idsToUpdate.length > 0) {
        await prisma.booking.updateMany({
          where: { id: { in: idsToUpdate } },
          data: { status: BookingStatus.COMPLETED },
        });
        console.log(`✅ [Cron] Updated ${idsToUpdate.length} bookings to COMPLETED status.`);
      }
    } catch (error) {
      console.error("❌ [Cron] Error checking completed bookings:", error);
    }
  });
};
