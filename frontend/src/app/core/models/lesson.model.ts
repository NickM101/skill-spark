import { Course } from './course.model';
import { Progress } from './progress.model';
import { QuizAttempt } from './quiz-attempt.model';

export enum LessonType {
  TEXT = 'TEXT',
  VIDEO = 'VIDEO',
  PDF = 'PDF',
  QUIZ = 'QUIZ',
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
  // Relations
  course?: Course;
  progress?: Progress[];

  // Progress tracking (populated at runtime)
  isCompleted?: boolean;
  completedAt?: Date;
  lastAccessedAt?: Date;
  timeSpent?: number; // in seconds
  position?: number; // for video time or PDF page tracking

  // NEW: Quiz-specific properties
  hasQuiz?: boolean; // For non-quiz lessons that have associated quizzes
  quizId?: string; // Reference to quiz if applicable
  quizRequired?: boolean;
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

  quizAttempts?: QuizAttempt[];
  quizPassed?: boolean;
  bestQuizScore?: number;
}

export interface LessonNavigationItem {
  lesson: Lesson;
  isAccessible: boolean;
  isCompleted: boolean;
  isCurrent: boolean;

  hasQuiz: boolean; // NEW: Indicates if lesson has a quiz
  quizPassed?: boolean;
}

export interface LessonPlayerState {
  currentLesson: Lesson | null;
  previousLesson: Lesson | null;
  nextLesson: Lesson | null;
  courseProgress: number; // percentage
  lessonIndex: number;
  totalLessons: number;
  hasQuiz: boolean; // NEW: Current lesson has quiz
  nextQuizLesson: Lesson | null;
}



export interface CreateLessonRequest {
  title: string;
  content?: string;
  type: LessonType;
  videoUrl?: string;
  fileUrl?: string;
  orderIndex?: number;
  isPublished?: boolean;
}

export interface UpdateLessonRequest {
  title?: string;
  content?: string;
  type?: LessonType;
  videoUrl?: string;
  fileUrl?: string;
  orderIndex?: number;
  isPublished?: boolean;
}

export interface LessonListResponse {
  lessons: Lesson[];
  total: number;
}

export interface LessonQueryParams {
  isPublished?: boolean;
}

export interface ReorderLessonsRequest {
  lessonIds: string[];
}

// Helper interfaces for forms
export interface LessonFormData {
  title: string;
  content: string;
  type: LessonType;
  videoUrl: string;
  fileUrl: string;
  isPublished: boolean;
}

// Lesson progress interface
export interface LessonProgress {
  id: string;
  lessonId: string;
  userId: string;
  courseId: string;
  isCompleted: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}