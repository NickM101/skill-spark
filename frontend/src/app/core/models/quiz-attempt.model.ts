import { Answer } from './answer.model';

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
  answers?: Answer[];
}
