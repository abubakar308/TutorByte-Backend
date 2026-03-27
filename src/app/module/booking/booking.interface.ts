export interface IBookingCreate {
  tutorId: string;
  bookingDate: string; // ISO string
  startTime: string;   // e.g., "10:00"
  endTime: string;     // e.g., "11:00"
  totalPrice: number;
}

export interface IBookingUpdate {
  status?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
}

export interface IReviewCreate {
  tutorId: string;
  rating: number;
  comment: string;
}

export interface IReviewResponse {
  id: string;
  tutorId: string;
  studentId: string;
  rating: number;
  comment: string;
  createdAt: Date;
}