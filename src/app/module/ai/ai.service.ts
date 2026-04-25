import { prisma } from "../../lib/prisma";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
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
 * DATABASE TOOLS FOR AI
 */
const dbTools = {
  searchTutors: async ({ query }: { query: string }) => {
    const tutors = await prisma.tutorProfile.findMany({
      where: {
        isApproved: true,
        OR: [
          { bio: { contains: query, mode: "insensitive" } },
          { user: { name: { contains: query, mode: "insensitive" } } },
          { subjects: { some: { subject: { name: { contains: query, mode: "insensitive" } } } } }
        ]
      },
      take: 5,
      include: {
        user: { select: { name: true } },
        subjects: { include: { subject: true } },
      },
      orderBy: { averageRating: "desc" },
    });
    return tutors.map(t => ({
      name: t.user.name,
      subjects: t.subjects.map(s => s.subject.name),
      rating: t.averageRating,
      rate: `$${t.hourlyRate}`,
      bio: t.bio?.substring(0, 100) + "..."
    }));
  },

  getAvailableSubjects: async () => {
    return await prisma.subject.findMany({
      select: { name: true, category: true },
    });
  },

  getPlatformStats: async () => {
    const [tutors, subjects, students, bookings] = await Promise.all([
      prisma.tutorProfile.count({ where: { isApproved: true } }),
      prisma.subject.count(),
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.booking.count(),
    ]);
    return {
      totalTutors: tutors,
      totalSubjects: subjects,
      activeStudents: students,
      completedBookings: bookings
    };
  }
};

/**
 * FEATURE 1: AI CHAT ASSISTANT (WITH DIRECT DB ACCESS)
 */
const generateChatReply = async (
  messages: IChatMessage[]
): Promise<IChatResponse> => {
  const model = genAI.getGenerativeModel({
    model: "gemini-flash-latest",
    tools: [
      {
        functionDeclarations: [
          {
            name: "searchTutors",
            description: "Search for tutors based on a name, subject, or specialty query.",
            parameters: {
              type: SchemaType.OBJECT,
              properties: {
                query: { 
                  type: SchemaType.STRING, 
                  description: "The search term (e.g., 'Math', 'John', 'Piano')" 
                }
              },
              required: ["query"]
            }
          },
          {
            name: "getAvailableSubjects",
            description: "Retrieve a list of all subjects and categories available on TutorByte.",
          },
          {
            name: "getPlatformStats",
            description: "Get real-time platform statistics like total tutors, students, and bookings.",
          }
        ]
      }
    ]
  });

  const chat = model.startChat({
    history: messages.slice(0, -1).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    })),
  });

  const latestMessage = messages[messages.length - 1].content;
  let result = await chat.sendMessage(latestMessage);
  let response = result.response;

  // Handle Function Calls (if Gemini wants to query the DB)
  const calls = response.candidates?.[0]?.content?.parts?.filter(p => p.functionCall);

  if (calls && calls.length > 0) {
    const toolResponses = await Promise.all(calls.map(async (call) => {
      const functionName = call.functionCall!.name as keyof typeof dbTools;
      const args = call.functionCall!.args;
      
      console.log(`AI calling tool: ${functionName}`, args);
      
      const data = await (dbTools[functionName] as any)(args);
      
      return {
        functionResponse: {
          name: functionName,
          response: { content: data }
        }
      };
    }));

    // Send the data back to Gemini to generate the final "real" reply
    const finalResult = await chat.sendMessage(toolResponses as any);
    response = finalResult.response;
  }
  
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
