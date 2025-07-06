import { Answer } from './answer.model';

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
}

export interface Question {
  id: string;
  quizId: string;
  question: string;
  type: QuestionType;
  options?: any; // Prefer defining actual structure if possible
  correctAnswers: any;
  points: number;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
  answers?: Answer[];
}
