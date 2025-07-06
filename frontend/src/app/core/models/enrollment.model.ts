import { Course } from './course.model';
import { Progress } from './progress.model';
import { User } from './user.model';

export enum EnrollmentStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  DROPPED = 'DROPPED',
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: Date;
  completedAt?: Date;
  progressPercent: number;
  status: EnrollmentStatus;
  user?: User;
  course?: Course;
}
