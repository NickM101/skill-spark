// src/app/core/models/course.model.ts

export enum CourseLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
}

export enum LessonType {
  TEXT = 'TEXT',
  VIDEO = 'VIDEO',
  PDF = 'PDF',
}

export enum EnrollmentStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  DROPPED = 'DROPPED',
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Lesson {
  id: string;
  title: string;
  content?: string;
  type: LessonType;
  videoUrl?: string;
  fileUrl?: string;
  orderIndex: number;
  courseId: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Course {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  price?: number;
  level: CourseLevel;
  categoryId: string;
  instructorId: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  category?: Category;
  instructor?: User;
  lessons?: Lesson[];
  enrollments?: Enrollment[];
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: Date;
  completedAt?: Date;
  progressPercent: number;
  status: EnrollmentStatus;

  // Relations
  user?: User;
  course?: Course;
}

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

// DTOs for API calls
export interface CreateCourseDto {
  title: string;
  description?: string;
  thumbnail?: string;
  price?: number;
  level: CourseLevel;
  categoryId: string;
}

export interface UpdateCourseDto extends Partial<CreateCourseDto> {
  isPublished?: boolean;
}

export interface CourseFilters {
  categoryId?: string;
  level?: CourseLevel;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  instructorId?: string;
  isPublished?: boolean;
}

export interface CourseListResponse {
  courses: Course[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EnrollmentRequest {
  courseId: string;
}

export interface CourseStats {
  totalEnrollments: number;
  completionRate: number;
  averageRating: number;
  totalRevenue: number;
}
