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
  updatedAt: Date;

  // Relations
  user?: User;
  course?: Course;
  progress?: Progress[];
}


export interface CreateEnrollmentDto {
  courseId: string;
}

export interface UpdateEnrollmentDto {
  status?: EnrollmentStatus;
  progressPercent?: number;
}

export interface EnrollmentFilters {
  page?: number;
  limit?: number;
  courseId?: string;
  status?: EnrollmentStatus;
  search?: string;
  userId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface EnrollmentStats {
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  droppedEnrollments: number;
  averageProgress: number;
  enrollmentsByMonth: Array<{
    month: string;
    count: number;
  }>;
  topCourses: Array<{
    courseId: string;
    courseTitle: string;
    enrollmentCount: number;
  }>;
}
