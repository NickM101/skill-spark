import { Question } from './question.model';
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
  questions?: Question[];
  attempts?: QuizAttempt[];
}
