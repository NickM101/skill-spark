// src/app/features/lessons/services/lesson.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';

import { ApiService } from '@core/services/api.service';
import {
  Lesson,
  CreateLessonRequest,
  UpdateLessonRequest,
  LessonListResponse,
  LessonQueryParams,
  ReorderLessonsRequest,
} from '@core/models/lesson.model';

@Injectable({
  providedIn: 'root',
})
export class LessonService {
  private lessonsSubject = new BehaviorSubject<Lesson[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  public lessons$ = this.lessonsSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  constructor(private apiService: ApiService) {}

  // ----------------------
  // Public CRUD Methods
  // ----------------------

  /**
   * Get all lessons for a course
   */
  getLessons(
    courseId: string,
    params: LessonQueryParams = {}
  ): Observable<LessonListResponse> {
    this.loadingSubject.next(true);

    const queryParams = {
      ...(params.isPublished !== undefined && {
        isPublished: params.isPublished,
      }),
    };

    return this.apiService
      .get<Lesson[]>(`/courses/${courseId}/lessons`, queryParams)
      .pipe(
        map((response) => {
          const lessons = this.apiService.extractData(response) || [];

          // Sort lessons by order index
          const sortedLessons = lessons.sort(
            (a, b) => a.orderIndex - b.orderIndex
          );

          // Update local state
          this.lessonsSubject.next(sortedLessons);

          return {
            lessons: sortedLessons,
            total: sortedLessons.length,
          };
        }),
        tap(() => this.loadingSubject.next(false)),
        catchError((error) => {
          this.loadingSubject.next(false);
          throw error;
        })
      );
  }

  /**
   * Get a single lesson
   */
  getLesson(courseId: string, lessonId: string): Observable<Lesson> {
    this.loadingSubject.next(true);

    return this.apiService
      .get<Lesson>(`/courses/${courseId}/lessons/${lessonId}`)
      .pipe(
        map((response) => this.apiService.extractData(response)!),
        tap(() => this.loadingSubject.next(false)),
        catchError((error) => {
          this.loadingSubject.next(false);
          throw error;
        })
      );
  }

  /**
   * Create a new lesson
   */
  createLesson(
    courseId: string,
    request: CreateLessonRequest
  ): Observable<Lesson> {
    this.loadingSubject.next(true);

    const createDto = {
      title: request.title,
      content: request.content || undefined,
      type: request.type,
      videoUrl: request.videoUrl || undefined,
      fileUrl: request.fileUrl || undefined,
      orderIndex: request.orderIndex,
      isPublished: request.isPublished || false,
    };

    return this.apiService
      .post<Lesson>(`/courses/${courseId}/lessons`, createDto)
      .pipe(
        map((response) => {
          const newLesson = this.apiService.extractData(response)!;

          // Update local state
          const currentLessons = this.lessonsSubject.value;
          const updatedLessons = [...currentLessons, newLesson].sort(
            (a, b) => a.orderIndex - b.orderIndex
          );
          this.lessonsSubject.next(updatedLessons);

          return newLesson;
        }),
        tap(() => this.loadingSubject.next(false)),
        catchError((error) => {
          this.loadingSubject.next(false);
          throw error;
        })
      );
  }

  /**
   * Update an existing lesson
   */
  updateLesson(
    courseId: string,
    lessonId: string,
    request: UpdateLessonRequest
  ): Observable<Lesson> {
    this.loadingSubject.next(true);

    const updateDto = {
      ...(request.title !== undefined && { title: request.title }),
      ...(request.content !== undefined && { content: request.content }),
      ...(request.type !== undefined && { type: request.type }),
      ...(request.videoUrl !== undefined && { videoUrl: request.videoUrl }),
      ...(request.fileUrl !== undefined && { fileUrl: request.fileUrl }),
      ...(request.orderIndex !== undefined && {
        orderIndex: request.orderIndex,
      }),
      ...(request.isPublished !== undefined && {
        isPublished: request.isPublished,
      }),
    };

    return this.apiService
      .patch<Lesson>(`/courses/${courseId}/lessons/${lessonId}`, updateDto)
      .pipe(
        map((response) => {
          const updatedLesson = this.apiService.extractData(response)!;

          // Update local state
          this.updateLessonInState(updatedLesson);

          return updatedLesson;
        }),
        tap(() => this.loadingSubject.next(false)),
        catchError((error) => {
          this.loadingSubject.next(false);
          throw error;
        })
      );
  }

  /**
   * Delete a lesson
   */
  deleteLesson(courseId: string, lessonId: string): Observable<void> {
    this.loadingSubject.next(true);

    return this.apiService
      .delete<null>(`/courses/${courseId}/lessons/${lessonId}`)
      .pipe(
        map(() => {
          // Update local state
          this.removeLessonFromState(lessonId);

          return void 0;
        }),
        tap(() => this.loadingSubject.next(false)),
        catchError((error) => {
          this.loadingSubject.next(false);
          throw error;
        })
      );
  }

  /**
   * Reorder lessons
   */
  reorderLessons(courseId: string, lessonIds: string[]): Observable<Lesson[]> {
    this.loadingSubject.next(true);

    const reorderDto: ReorderLessonsRequest = { lessonIds };

    return this.apiService
      .patch<Lesson[]>(`/courses/${courseId}/lessons/reorder`, reorderDto)
      .pipe(
        map((response) => {
          const reorderedLessons = this.apiService.extractData(response) || [];

          // Update local state
          this.lessonsSubject.next(reorderedLessons);

          return reorderedLessons;
        }),
        tap(() => this.loadingSubject.next(false)),
        catchError((error) => {
          this.loadingSubject.next(false);
          throw error;
        })
      );
  }

  // ----------------------
  // Utility Methods
  // ----------------------

  /**
   * Get the next order index for a new lesson
   */
  getNextOrderIndex(): number {
    const lessons = this.lessonsSubject.value;
    if (lessons.length === 0) return 1;

    const maxOrderIndex = Math.max(
      ...lessons.map((lesson) => lesson.orderIndex)
    );
    return maxOrderIndex + 1;
  }

  /**
   * Validate lesson data
   */
  validateLessonData(
    lessonData: CreateLessonRequest | UpdateLessonRequest
  ): string[] {
    const errors: string[] = [];

    if (
      'title' in lessonData &&
      (!lessonData.title || lessonData.title.trim().length < 2)
    ) {
      errors.push('Lesson title must be at least 2 characters long');
    }

    if (
      'title' in lessonData &&
      lessonData.title &&
      lessonData.title.length > 200
    ) {
      errors.push('Lesson title cannot exceed 200 characters');
    }

    if (
      'content' in lessonData &&
      lessonData.content &&
      lessonData.content.length > 10000
    ) {
      errors.push('Lesson content cannot exceed 10,000 characters');
    }

    if ('videoUrl' in lessonData && lessonData.videoUrl) {
      const urlPattern = /^https?:\/\/.+/;
      if (!urlPattern.test(lessonData.videoUrl)) {
        errors.push('Video URL must be a valid HTTP/HTTPS URL');
      }
    }

    if ('fileUrl' in lessonData && lessonData.fileUrl) {
      const urlPattern = /^https?:\/\/.+/;
      if (!urlPattern.test(lessonData.fileUrl)) {
        errors.push('File URL must be a valid HTTP/HTTPS URL');
      }
    }

    return errors;
  }

  /**
   * Check if lesson title exists in course
   */
  lessonTitleExists(
    courseId: string,
    title: string,
    excludeId?: string
  ): Observable<boolean> {
    return this.lessons$.pipe(
      map((lessons) => {
        return lessons.some(
          (lesson) =>
            lesson.title.toLowerCase() === title.toLowerCase() &&
            lesson.id !== excludeId &&
            lesson.courseId === courseId
        );
      })
    );
  }

  /**
   * Get published lessons only
   */
  getPublishedLessons(courseId: string): Observable<LessonListResponse> {
    return this.getLessons(courseId, { isPublished: true });
  }

  /**
   * Get draft lessons only
   */
  getDraftLessons(courseId: string): Observable<LessonListResponse> {
    return this.getLessons(courseId, { isPublished: false });
  }

  /**
   * Publish a lesson
   */
  publishLesson(courseId: string, lessonId: string): Observable<Lesson> {
    return this.updateLesson(courseId, lessonId, { isPublished: true });
  }

  /**
   * Unpublish a lesson
   */
  unpublishLesson(courseId: string, lessonId: string): Observable<Lesson> {
    return this.updateLesson(courseId, lessonId, { isPublished: false });
  }

  // ----------------------
  // State Management
  // ----------------------

  /**
   * Clear local state
   */
  clearLessons(): void {
    this.lessonsSubject.next([]);
  }

  /**
   * Get current lessons from local state
   */
  getCurrentLessons(): Lesson[] {
    return this.lessonsSubject.value;
  }

  /**
   * Update a single lesson in local state
   */
  updateLessonInState(lesson: Lesson): void {
    const currentLessons = this.lessonsSubject.value;
    const index = currentLessons.findIndex((l) => l.id === lesson.id);

    if (index !== -1) {
      const updatedLessons = [...currentLessons];
      updatedLessons[index] = lesson;
      this.lessonsSubject.next(
        updatedLessons.sort((a, b) => a.orderIndex - b.orderIndex)
      );
    }
  }

  /**
   * Add a lesson to local state
   */
  addLessonToState(lesson: Lesson): void {
    const currentLessons = this.lessonsSubject.value;
    const updatedLessons = [...currentLessons, lesson].sort(
      (a, b) => a.orderIndex - b.orderIndex
    );
    this.lessonsSubject.next(updatedLessons);
  }

  /**
   * Remove a lesson from local state
   */
  removeLessonFromState(id: string): void {
    const currentLessons = this.lessonsSubject.value;
    const updatedLessons = currentLessons.filter((l) => l.id !== id);
    this.lessonsSubject.next(updatedLessons);
  }

  /**
   * Get lesson by ID from local state
   */
  getLessonFromState(id: string): Lesson | undefined {
    return this.lessonsSubject.value.find((l) => l.id === id);
  }

  /**
   * Get lesson statistics
   */
  getLessonStats(): Observable<{
    total: number;
    published: number;
    draft: number;
    byType: { [key: string]: number };
  }> {
    return this.lessons$.pipe(
      map((lessons) => {
        const published = lessons.filter((l) => l.isPublished);
        const draft = lessons.filter((l) => !l.isPublished);

        const byType = lessons.reduce((acc, lesson) => {
          acc[lesson.type] = (acc[lesson.type] || 0) + 1;
          return acc;
        }, {} as { [key: string]: number });

        return {
          total: lessons.length,
          published: published.length,
          draft: draft.length,
          byType,
        };
      })
    );
  }
}
