export interface ICreateTutorProfile {
  bio: string;
  hourlyRate: number;
  subjects: string[];
  languages: string[];
  experienceYears?: number;
}

export interface IUpdateTutorProfile {
  bio?: string;
  hourlyRate?: number;
  subjects?: string[];
  languages?: string[];
  experienceYears?: number;
}

export interface IAvailabilitySlot {
  dayOfWeek: number;    // 0 = Sunday … 6 = Saturday
  startTime: string;    // "HH:MM"  24-hr in tutor's timezone
  endTime: string;      // "HH:MM"
}

export interface ISetAvailabilityPayload {
  slots: IAvailabilitySlot[];
}
