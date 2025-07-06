export interface Answer {
  id: string;
  questionId: string;
  attemptId: string;
  answer: any;
  isCorrect?: boolean;
  pointsEarned: number;
  createdAt: Date;
}
