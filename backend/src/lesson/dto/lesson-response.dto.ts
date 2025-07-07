import { LessonType } from '../../../generated/prisma';

export class LessonResponseDto {
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
  course?: {
    id: string;
    title: string;
    instructorId: string;
  };
}
