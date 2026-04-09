import { prisma } from "../../lib/prisma";
import OpenAI from "openai";
import {
  IChatMessage,
    IChatResponse,
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


const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const generateChatReply = async (
  messages: IChatMessage[]
): Promise<IChatResponse> => {
  const latestUserMessage =
    messages.filter((msg) => msg.role === "user").at(-1)?.content || "";

  if (!latestUserMessage) {
    throw new Error("User message is required");
  }

  const response = await client.responses.create({
    model: "gpt-5.4",
    instructions: `
You are TutorByte AI Assistant.
You help users with tutor booking, payments, becoming a tutor, dashboard help, and common FAQs.
Keep answers concise, helpful, and practical.
Do not invent unavailable data.
    `,
    input: latestUserMessage,
  });

  return {
    reply: response.output_text || "Sorry, I could not generate a response.",
  };
};



export const AIService = {
  getSearchSuggestions,
  getRecommendedTutors,
  generateChatReply,
};