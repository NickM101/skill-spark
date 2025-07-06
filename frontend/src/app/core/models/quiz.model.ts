import { Course } from './course.model';
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
  // Relations
  course?: Course;
  questions?: Question[];
  attempts?: QuizAttempt[];
}
