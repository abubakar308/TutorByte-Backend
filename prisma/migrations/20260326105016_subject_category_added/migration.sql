/*
  Warnings:

  - Added the required column `categories` to the `Subject` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SubjectCategory" AS ENUM ('ACADEMIC', 'SKILLS', 'LANGUAGE');

-- AlterTable
ALTER TABLE "Subject" ADD COLUMN     "categories" "SubjectCategory" NOT NULL;
