export class AttemptStatsDto {
  quizId: string;
  quizTitle: string;
  totalAttempts: number;
  completedAttempts: number;
  inProgressAttempts: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passRate: number;
  averageCompletionTime: number;
  attemptsByDay: { date: string; count: number }[];
}

export class UserAttemptDto {
  id: string;
  score: number | null;
  maxScore: number;
  isPassed: boolean;
  status: string;
  startedAt: Date;
  submittedAt: Date | null;
  completionTime: number | null;
  answers: {
    questionId: string;
    answer: any;
    isCorrect: boolean | null;
    pointsEarned: number;
  }[];
}
