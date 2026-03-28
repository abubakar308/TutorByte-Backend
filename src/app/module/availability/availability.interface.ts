import { DayOfWeek } from "../../../generated/prisma/enums";

export interface IAvailabilitySlot {
  dayOfWeek: DayOfWeek;
  startTime: string; // "HH:MM" 24-hour
  endTime: string;   // "HH:MM" 24-hour
  isActive: boolean;
}

export interface ISetAvailabilityPayload {
  slots: IAvailabilitySlot[];
}

export interface IUpdateAvailabilitySlot {
  startTime?: string;
  endTime?: string;
  isActive?: boolean;
}

// For checking if a specific datetime is available (used by booking)
export interface IAvailabilityCheckPayload {
  tutorId: string;      // TutorProfile.id
  bookingDate: string;  // ISO date string
  startTime: string;    // "HH:MM"
  endTime: string;      // "HH:MM"
}