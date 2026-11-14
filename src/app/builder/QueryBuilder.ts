import { Prisma } from "../../generated/prisma/client";

export class QueryHelper {
  // ১. Search Logic
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

  // ২. Filter Logic
  static filter(query: Record<string, any>, excludeFields: string[] = ["search", "searchTerm", "page", "limit", "sortBy", "sortOrder"]) {
    const finalFilters: Record<string, any> = {};
    
  
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