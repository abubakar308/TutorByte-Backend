import { prisma } from "../../lib/prisma";
import {
    IRecommendedTutor,
  ISearchSuggestionResponse,
} from "./ai.interface";

const getSearchSuggestions = async (
  query: string
): Promise<ISearchSuggestionResponse> => {
  const search = query.trim().toLowerCase();

  const subjects = await prisma.subject.findMany({
    where: {
      name: { contains: search, mode: "insensitive" },
    },
    select: {
      id: true,
      name: true,
    },
    take: 5,
  });

  const languages = await prisma.language.findMany({
    where: {
      name: { contains: search, mode: "insensitive" },
    },
    select: {
      id: true,
      name: true,
    },
    take: 5,
  });

  const tutors = await prisma.tutorProfile.findMany({
    where: {
      OR: [
        { bio: { contains: search, mode: "insensitive" } },
        {
          user: {
            name: { contains: search, mode: "insensitive" },
          },
        },
      ],
    },
    select: {
      id: true,
      bio: true,
      user: {
        select: {
          name: true,
        },
      },
    },
    take: 5,
  });

  return {
    subjects,
    languages,
    tutors,
  };
};


const getRecommendedTutors = async (
  userId: string
): Promise<IRecommendedTutor[]> => {
  const userBookings = await prisma.booking.findMany({
    where: { studentId: userId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const subjectIds = userBookings.map((b) => b.subjectId);

  const tutors = await prisma.tutorProfile.findMany({
    where: {
      subjects: {
        some: {
          subjectId: { in: subjectIds },
        },
      },
    },
    take: 6,
    include: {
      user: true,
      subjects: true,
      languages: true,
      _count: true,
    },
  });

  return tutors;
};


export const AIService = {
  getSearchSuggestions,
  getRecommendedTutors,
};