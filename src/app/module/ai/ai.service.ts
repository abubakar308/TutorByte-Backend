import { prisma } from "../../lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { envVars } from "../../config/env";
import {
  IChatMessage,
  IChatResponse,
  IRecommendedTutor,
  ISearchSuggestionResponse,
} from "./ai.interface";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(envVars.GEMINI_API_KEY);

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

/**
 * FEATURE 1: AI CHAT ASSISTANT
 */
const generateChatReply = async (
  messages: IChatMessage[]
): Promise<IChatResponse> => {
  const model = genAI.getGenerativeModel({ 
    model: "gemini-flash-latest",
    systemInstruction: `
      You are TutorByte AI Assistant.
      You help users with tutor booking, payments, becoming a tutor, dashboard help, and common FAQs.
      Keep answers concise, helpful, and practical.
      Always refer to the platform as TutorByte.
      If you don't know something, suggest contacting support.
    `
  });

  const chat = model.startChat({
    history: messages.slice(0, -1).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    })),
  });

  const latestMessage = messages[messages.length - 1].content;
  const result = await chat.sendMessage(latestMessage);
  const response = await result.response;
  
  return {
    reply: response.text(),
  };
};

/**
 * FEATURE 2: TUTOR BIO GENERATOR
 */
const generateTutorBio = async (payload: {
  subjects: string[];
  experienceYears: number;
  teachingStyle?: string;
}): Promise<{ bio: string }> => {
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });


  const prompt = `
    Act as a professional tutor copywriter. 
    Generate a compelling and professional "About Me" bio for a tutor.
    Subjects taught: ${payload.subjects.join(", ")}.
    Years of experience: ${payload.experienceYears}.
    Teaching style: ${payload.teachingStyle || "Professional and engaging"}.
    
    The bio should be around 100-150 words, highlight their expertise, and encourage students to book a session.
    Format the output as plain text.
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;

  return {
    bio: response.text(),
  };
};

export const AIService = {
  getSearchSuggestions,
  getRecommendedTutors,
  generateChatReply,
  generateTutorBio,
};