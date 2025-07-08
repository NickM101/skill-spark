import { Enrollment } from "./enrollment.model";
import { Lesson } from "./lesson.model";
import { User } from "./user.model";

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

  // Relations
  user?: User;
  lesson?: Lesson;
  enrollment?: Enrollment;
}
