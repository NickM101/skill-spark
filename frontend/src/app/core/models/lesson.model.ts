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

export interface LessonProgress {
  id: string;
  lessonId: string;
  userId: string;
  courseId: string;
  isCompleted: boolean;
  completedAt?: Date;
  timeSpent: number; // in seconds
  lastPosition?: number; // video time in seconds or PDF page number
  notes?: string;
  lastAccessedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LessonNavigationItem {
  lesson: Lesson;
  isAccessible: boolean;
  isCompleted: boolean;
  isCurrent: boolean;
}

export interface LessonPlayerState {
  currentLesson: Lesson | null;
  previousLesson: Lesson | null;
  nextLesson: Lesson | null;
  courseProgress: number; // percentage
  lessonIndex: number;
  totalLessons: number;
}