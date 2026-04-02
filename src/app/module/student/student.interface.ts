export interface IStudentStats {
  totalSessions: number;
  hoursLearned: string;
  totalInvested: number;
  avgRating: number;
}

export interface IProfileUpdate {
  name?: string;
  image?: string;
}