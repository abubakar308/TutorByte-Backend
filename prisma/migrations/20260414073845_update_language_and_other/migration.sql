/*
  Warnings:

  - You are about to drop the `Language` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TutorLanguages" DROP CONSTRAINT "TutorLanguages_languageId_fkey";

-- AlterTable
ALTER TABLE "subjects" ADD COLUMN     "image" TEXT;

-- DropTable
DROP TABLE "Language";

-- CreateTable
CREATE TABLE "languages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT,

    CONSTRAINT "languages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "languages_name_key" ON "languages"("name");

-- AddForeignKey
ALTER TABLE "TutorLanguages" ADD CONSTRAINT "TutorLanguages_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "languages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
