import { Answer } from './answer.model';
import { Quiz } from './quiz.model';

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
}

export interface Question {
  id: string;
  quizId: string;
  question: string;
  type: QuestionType;
  options?: any;
  correctAnswers: any;
  points: number;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  quiz?: Quiz;
  answers?: Answer[];
}
