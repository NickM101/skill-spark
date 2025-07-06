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

  // Progress tracking (populated at runtime)
  isCompleted?: boolean;
  completedAt?: Date;
  lastAccessedAt?: Date;
  timeSpent?: number; // in seconds
  position?: number; // for video time or PDF page tracking
}
