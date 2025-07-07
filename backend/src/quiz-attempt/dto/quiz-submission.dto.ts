export class QuizSubmissionDto {
  attemptId: string;
  score: number;
  maxScore: number;
  isPassed: boolean;
  completionTime: number;
  submittedAt: Date;
  gradedAt: Date;
}
