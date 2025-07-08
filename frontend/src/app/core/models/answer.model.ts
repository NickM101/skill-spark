import { Question } from "./question.model";
import { QuizAttempt } from "./quiz-attempt.model";

export interface Answer {
  id: string;
  questionId: string;
  attemptId: string;
  answer: any;
  isCorrect?: boolean;
  pointsEarned: number;
  createdAt: Date;
  // Relations
  question?: Question;
  attempt?: QuizAttempt;
}
