/*
  Warnings:

  - You are about to drop the `TutorLanguages` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TutorSubjects` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TutorLanguages" DROP CONSTRAINT "TutorLanguages_languageId_fkey";

-- DropForeignKey
ALTER TABLE "TutorLanguages" DROP CONSTRAINT "TutorLanguages_tutorId_fkey";

-- DropForeignKey
ALTER TABLE "TutorSubjects" DROP CONSTRAINT "TutorSubjects_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "TutorSubjects" DROP CONSTRAINT "TutorSubjects_tutorId_fkey";

-- DropTable
DROP TABLE "TutorLanguages";

-- DropTable
DROP TABLE "TutorSubjects";

-- CreateTable
CREATE TABLE "tutor_languages" (
    "id" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "languageId" TEXT NOT NULL,

    CONSTRAINT "tutor_languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tutor_subjects" (
    "id" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,

    CONSTRAINT "tutor_subjects_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tutor_languages" ADD CONSTRAINT "tutor_languages_languageId_fkey" FOREIGN KEY ("languageId") REFERENCES "languages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutor_languages" ADD CONSTRAINT "tutor_languages_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "tutor_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutor_subjects" ADD CONSTRAINT "tutor_subjects_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutor_subjects" ADD CONSTRAINT "tutor_subjects_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "tutor_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
