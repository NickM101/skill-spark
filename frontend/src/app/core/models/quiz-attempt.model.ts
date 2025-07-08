import { Answer } from './answer.model';
import { Quiz } from './quiz.model';
import { User } from './user.model';

export enum AttemptStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  GRADED = 'GRADED',
}

export interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  score?: number;
  maxScore: number;
  isPassed: boolean;
  startedAt: Date;
  submittedAt?: Date;
  status: AttemptStatus;
  // Relations
  user?: User;
  quiz?: Quiz;
  answers?: Answer[];
}
