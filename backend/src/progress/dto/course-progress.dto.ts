export class CourseProgressDto {
  courseId: string;
  courseName: string;
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
  lastActivity?: Date;
  remainingLessons: number;
}
