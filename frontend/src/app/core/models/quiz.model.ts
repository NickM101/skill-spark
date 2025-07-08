import { Course } from './course.model';
import { Question, QuestionStats } from './question.model';
import { QuizAttempt } from './quiz-attempt.model';

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  courseId: string;
  timeLimit?: number;
  passingScore: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  course?: Course;
  questions?: Question[];
  attempts?: QuizAttempt[];
  _count?: {
    questions: number;
    attempts: number;
  };
}


export interface QuizStats {
  totalAttempts: number;
  averageScore: number;
  passRate: number;
  completionRate: number;
  questionStats: QuestionStats[];
}

export interface CreateQuizDto {
  title: string;
  description?: string;
  timeLimit?: number;
  passingScore: number;
}

export interface UpdateQuizDto {
  title?: string;
  description?: string;
  timeLimit?: number;
  passingScore?: number;
}

export interface QuizFilters {
  courseId?: string;
  isPublished?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}