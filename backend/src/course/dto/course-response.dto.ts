import { CourseLevel } from '../../../generated/prisma';

export class CourseResponseDto {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  price?: number;
  level: CourseLevel;
  isPublished: boolean;
  categoryId: string;
  instructorId?: string;
  createdAt: Date;
  updatedAt: Date;

  category?: {
    id: string;
    name: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
  };

  instructor?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };

  lessons?: any[];
  quizzes?: any[];

  _count?: {
    lessons: number;
    enrollments: number;
    quizzes: number;
  };
}
