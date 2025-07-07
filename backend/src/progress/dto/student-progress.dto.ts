export class StudentProgressDto {
  userId: string;
  fullName: string;
  email: string;
  progressPercentage: number;
  completedLessons: number;
  totalLessons: number;
  lastActivity?: Date;
}
