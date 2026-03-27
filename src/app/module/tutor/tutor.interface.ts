export interface ICreateTutorProfile {
  bio: string;
  hourlyRate: number;
  subjects: string[];
  languages: string[];
  experienceYrs?: number;
  education?: string;
  timezone?: string;
}

export interface IUpdateTutorProfile {
  bio?: string;
  hourlyRate?: number;
  subjects?: string[];
  languages?: string[];
  experienceYrs?: number;
  education?: string;
  timezone?: string;
  introVideoUrl?: string;
}

export interface IAvailabilitySlot {
  dayOfWeek: number;    // 0 = Sunday … 6 = Saturday
  startTime: string;    // "HH:MM"  24-hr in tutor's timezone
  endTime: string;      // "HH:MM"
  isRecurring?: boolean;
  specificDate?: string; // ISO date string – for one-off blocked/available dates
}

export interface ISetAvailabilityPayload {
  slots: IAvailabilitySlot[];
}

export interface ITutorSearchQuery {
  subject?: string;
  language?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  search?: string;       // full-text search on bio + headline
  sortBy?: "rating" | "price_asc" | "price_desc" | "reviews";
  page?: number;
  limit?: number;
}