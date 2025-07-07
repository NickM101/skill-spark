import { EnrollmentStatus } from '../../../generated/prisma';

export class EnrollmentResponseDto {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: Date;
  completedAt?: Date | null;
  progressPercent: number;
  status: EnrollmentStatus;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  course?: {
    id: string;
    title: string;
    description?: string | null;
    thumbnail?: string | null;
    instructor: {
      id: string;
      firstName: string;
      lastName: string;
    } | null;
  };
}
