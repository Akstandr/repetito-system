export type TutorCardFormat = "online" | "offline" | "mixed";

export interface TutorCardTutor {
  id: number;
  firstName: string;
  lastName: string;
  description: string | null;
  experience: string | null;
  education: string | null;
}

export interface TutorCard {
  id: number;
  tutorAccountId: number;
  title: string;
  description: string | null;
  subject: string;
  pricePerLesson: number;
  supportedGrades: number[];
  format: TutorCardFormat;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  tutor: TutorCardTutor;
}

export interface TutorCardPageResponse {
  items: TutorCard[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TutorReview {
  id: number;
  studentAccountId: number;
  studentFirstName: string;
  studentLastName: string;
  tutorAccountId: number;
  tutorFirstName: string;
  tutorLastName: string;
  rating: number;
  text: string;
  tutorReply: string | null;
  tutorRepliedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
