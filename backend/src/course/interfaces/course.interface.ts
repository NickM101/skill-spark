/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
import {
  Category,
  Lesson,
  Quiz,
  Enrollment,
  CourseLevel,
} from '../../../generated/prisma';

export interface CourseWithRelations {
  id: string;
  title: string;
  description?: string | null;
  thumbnail?: string | null;
  price?: any | null; // Use `Decimal` from Prisma if you have it imported, otherwise `any`
  level: CourseLevel;
  isPublished: boolean;
  categoryId: string;
  instructorId?: string | null;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  category: Category;
  instructor?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
  lessons: Lesson[];
  quizzes: Quiz[];
  enrollments: Enrollment[];
}
