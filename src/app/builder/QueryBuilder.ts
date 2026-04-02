import { Prisma } from "../../generated/prisma/client";

export class QueryHelper {
  // ১. Search Logic: একটি সার্চ টার্ম এবং সার্চেবল ফিল্ডের অ্যারে নেবে এবং Prisma এর জন্য একটি সার্চ অবজেক্ট রিটার্ন করবে
  static search(searchTerm: string | undefined, searchableFields: string[]) {
    if (!searchTerm) return {};

    return {
      OR: searchableFields.map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive" as Prisma.QueryMode, 
        },
      })),
    };
  }

  // ২. Filter Logic: স্ট্যাটাস, ক্যাটাগরি বা অন্য ফিক্সড ভ্যালুর জন্য
  static filter(query: Record<string, any>, excludeFields: string[] = ["search", "searchTerm", "page", "limit", "sortBy", "sortOrder"]) {
    const finalFilters: Record<string, any> = {};
    
    // query থেকে সার্চ এবং প্যাগিনেশন বাদ দিয়ে বাকি সব ফিল্টার হিসেবে নিবে
    Object.keys(query).forEach((key) => {
      if (!excludeFields.includes(key) && query[key]) {
        finalFilters[key] = query[key];
      }
    });

    return finalFilters;
  }

  // ৩. Pagination & Sorting
  static paginateAndSort(query: any) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const sortBy = query.sortBy || "createdAt";
    const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

    return {
      skip,
      take: limit,
      page,
      limit,
      orderBy: { [sortBy]: sortOrder },
    };
  }
}