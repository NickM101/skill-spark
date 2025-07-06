export interface Progress {
  id: string;
  userId: string;
  courseId: string;
  lessonId: string;
  enrollmentId: string;
  isCompleted: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
