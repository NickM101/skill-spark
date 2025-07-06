import { Progress } from './progress.model';

export enum LessonType {
  TEXT = 'TEXT',
  VIDEO = 'VIDEO',
  PDF = 'PDF',
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
  progress?: Progress[];
}
