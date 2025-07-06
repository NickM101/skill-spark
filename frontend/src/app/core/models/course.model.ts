import { User } from './user.model';
import { Category } from './category.model';
import { Lesson } from './lesson.model';
import { Enrollment } from './enrollment.model';
import { Quiz } from './quiz.model';

export enum CourseLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
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

  // Optional nested objects if needed
  category?: Category;
  instructor?: User;
  lessons?: Lesson[];
  enrollments?: Enrollment[];
  quizzes?: Quiz[];
  _count?: {
    enrollments: number;
    lessons: number;
    quizzes: number;
  };
}


export interface CourseFilters {
  search?: string;
  categoryId?: string;
  level?: CourseLevel;
  isPublished?: boolean;
  instructorId?: string;
  sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'enrollments';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CourseStats {
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  totalEnrollments: number;
  totalRevenue: number;
  avgRating: number;
}