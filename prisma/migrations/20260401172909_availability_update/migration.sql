/*
  Warnings:

  - You are about to drop the column `studentId` on the `availability` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "availability" DROP COLUMN "studentId",
ALTER COLUMN "startTime" SET DATA TYPE TEXT,
ALTER COLUMN "endTime" SET DATA TYPE TEXT;
