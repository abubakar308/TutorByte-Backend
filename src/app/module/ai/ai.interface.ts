export interface ISearchSuggestionQuery {
  query: string;
}

export interface ISuggestionSubject {
  id: string;
  name: string;
}

export interface ISuggestionLanguage {
  id: string;
  name: string;
}

export interface ISuggestionTutor {
  id: string;
  bio: string | null;
  user: {
    name: string | null;
  };
}

export interface ISearchSuggestionResponse {
  subjects: ISuggestionSubject[];
  languages: ISuggestionLanguage[];
  tutors: ISuggestionTutor[];
}

export interface IRecommendedTutor {
  id: string;
  user: {
    name: string | null;
    email?: string;
  };
  subjects: any[];
  languages: any[];
  _count: {
    bookings: number;
  };
}

export interface IRecommendedTutorResponse {
  tutors: IRecommendedTutor[];
}

export interface IChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface IChatRequestBody {
  messages: IChatMessage[];
}

export interface IChatResponse {
  reply: string;
}