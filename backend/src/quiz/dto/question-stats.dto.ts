export class QuestionStatsDto {
  questionId: string;
  questionText: string;
  correctAnswerRate: number;
  timesAnswered: number;
}

export class RecentAttemptDto {
  userId: string;
  fullName: string;
  score: number;
  passed: boolean;
  completionTime: number;
  attemptDate: Date;
}

export class QuizStatsDto {
  quizId: string;
  quizTitle: string;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passRate: number;
  totalAttempts: number;
  averageCompletionTime: number;
  questionStats: QuestionStatsDto[];
  recentAttempts: RecentAttemptDto[];
}
