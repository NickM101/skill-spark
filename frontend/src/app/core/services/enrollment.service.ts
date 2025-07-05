// src/app/core/services/enrollment.service.ts

import { Injectable } from '@angular/core';
import {
  Observable,
  BehaviorSubject,
  of,
  delay,
  map,
  switchMap,
  catchError,
  throwError,
} from 'rxjs';
import {
  Enrollment,
  EnrollmentStatus,
  EnrollmentRequest,
  Course,
  Progress,
} from '../models/course.model';

@Injectable({
  providedIn: 'root',
})
export class EnrollmentService {
  private enrollmentsSubject = new BehaviorSubject<Enrollment[]>([]);
  public enrollments$ = this.enrollmentsSubject.asObservable();

  private progressSubject = new BehaviorSubject<Progress[]>([]);
  public progress$ = this.progressSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData(): void {
    // Mock enrollments
    const mockEnrollments: Enrollment[] = [
      {
        id: '1',
        userId: '1', // Mock current user
        courseId: '1',
        enrolledAt: new Date('2024-01-15'),
        progressPercent: 45,
        status: EnrollmentStatus.ACTIVE,
      },
      {
        id: '2',
        userId: '1',
        courseId: '3',
        enrolledAt: new Date('2024-01-10'),
        completedAt: new Date('2024-02-15'),
        progressPercent: 100,
        status: EnrollmentStatus.COMPLETED,
      },
    ];

    // Mock progress records
    const mockProgress: Progress[] = [
      {
        id: '1',
        userId: '1',
        courseId: '1',
        lessonId: '1',
        enrollmentId: '1',
        isCompleted: true,
        completedAt: new Date('2024-01-16'),
        createdAt: new Date('2024-01-16'),
        updatedAt: new Date('2024-01-16'),
      },
      {
        id: '2',
        userId: '1',
        courseId: '1',
        lessonId: '2',
        enrollmentId: '1',
        isCompleted: true,
        completedAt: new Date('2024-01-18'),
        createdAt: new Date('2024-01-18'),
        updatedAt: new Date('2024-01-18'),
      },
      {
        id: '3',
        userId: '1',
        courseId: '1',
        lessonId: '3',
        enrollmentId: '1',
        isCompleted: false,
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-20'),
      },
    ];

    this.enrollmentsSubject.next(mockEnrollments);
    this.progressSubject.next(mockProgress);
  }

  // Enroll in a course
  enrollInCourse(courseId: string): Observable<Enrollment> {
    this.loadingSubject.next(true);

    return of(null).pipe(
      delay(1000), // Simulate API call
      map(() => {
        const currentUserId = '1'; // Mock current user ID
        const existingEnrollment = this.enrollmentsSubject.value.find(
          (e) => e.userId === currentUserId && e.courseId === courseId
        );

        if (existingEnrollment) {
          throw new Error('Already enrolled in this course');
        }

        const newEnrollment: Enrollment = {
          id: Date.now().toString(),
          userId: currentUserId,
          courseId,
          enrolledAt: new Date(),
          progressPercent: 0,
          status: EnrollmentStatus.ACTIVE,
        };

        const enrollments = [...this.enrollmentsSubject.value, newEnrollment];
        this.enrollmentsSubject.next(enrollments);
        this.loadingSubject.next(false);

        return newEnrollment;
      }),
      catchError((error) => {
        this.loadingSubject.next(false);
        return throwError(() => error);
      })
    );
  }

  // Get user enrollments
  getUserEnrollments(userId?: string): Observable<Enrollment[]> {
    const currentUserId = userId || '1'; // Mock current user ID

    return this.enrollments$.pipe(
      map((enrollments) =>
        enrollments.filter((e) => e.userId === currentUserId)
      )
    );
  }

  // Get enrollment by course ID
  getEnrollmentByCourse(
    courseId: string,
    userId?: string
  ): Observable<Enrollment | null> {
    const currentUserId = userId || '1'; // Mock current user ID

    return this.enrollments$.pipe(
      map(
        (enrollments) =>
          enrollments.find(
            (e) => e.userId === currentUserId && e.courseId === courseId
          ) || null
      )
    );
  }

  // Check if user is enrolled in course
  isEnrolledInCourse(courseId: string, userId?: string): Observable<boolean> {
    return this.getEnrollmentByCourse(courseId, userId).pipe(
      map((enrollment) => !!enrollment)
    );
  }

  // Update lesson progress
  updateLessonProgress(
    lessonId: string,
    courseId: string,
    isCompleted: boolean
  ): Observable<Progress> {
    this.loadingSubject.next(true);

    return of(null).pipe(
      delay(500),
      map(() => {
        const currentUserId = '1'; // Mock current user ID
        const progressRecords = [...this.progressSubject.value];

        // Find existing progress record
        const existingProgressIndex = progressRecords.findIndex(
          (p) => p.userId === currentUserId && p.lessonId === lessonId
        );

        let progressRecord: Progress;

        if (existingProgressIndex !== -1) {
          // Update existing record
          progressRecord = {
            ...progressRecords[existingProgressIndex],
            isCompleted,
            completedAt: isCompleted ? new Date() : undefined,
            updatedAt: new Date(),
          };
          progressRecords[existingProgressIndex] = progressRecord;
        } else {
          // Create new progress record
          const enrollment = this.enrollmentsSubject.value.find(
            (e) => e.userId === currentUserId && e.courseId === courseId
          );

          if (!enrollment) {
            throw new Error('Enrollment not found');
          }

          progressRecord = {
            id: Date.now().toString(),
            userId: currentUserId,
            courseId,
            lessonId,
            enrollmentId: enrollment.id,
            isCompleted,
            completedAt: isCompleted ? new Date() : undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          progressRecords.push(progressRecord);
        }

        this.progressSubject.next(progressRecords);

        // Update course progress percentage
        this.updateCourseProgress(courseId, currentUserId);

        this.loadingSubject.next(false);
        return progressRecord;
      }),
      catchError((error) => {
        this.loadingSubject.next(false);
        return throwError(() => error);
      })
    );
  }

  // Get lesson progress
  getLessonProgress(
    lessonId: string,
    userId?: string
  ): Observable<Progress | null> {
    const currentUserId = userId || '1'; // Mock current user ID

    return this.progress$.pipe(
      map(
        (progressRecords) =>
          progressRecords.find(
            (p) => p.userId === currentUserId && p.lessonId === lessonId
          ) || null
      )
    );
  }

  // Get course progress
  getCourseProgress(courseId: string, userId?: string): Observable<Progress[]> {
    const currentUserId = userId || '1'; // Mock current user ID

    return this.progress$.pipe(
      map((progressRecords) =>
        progressRecords.filter(
          (p) => p.userId === currentUserId && p.courseId === courseId
        )
      )
    );
  }

  // Update course progress percentage
  private updateCourseProgress(courseId: string, userId: string): void {
    // This would typically calculate based on completed lessons vs total lessons
    const progressRecords = this.progressSubject.value.filter(
      (p) => p.userId === userId && p.courseId === courseId
    );

    const completedLessons = progressRecords.filter(
      (p) => p.isCompleted
    ).length;
    const totalLessons = progressRecords.length;

    if (totalLessons === 0) return;

    const progressPercent = Math.round((completedLessons / totalLessons) * 100);

    const enrollments = [...this.enrollmentsSubject.value];
    const enrollmentIndex = enrollments.findIndex(
      (e) => e.userId === userId && e.courseId === courseId
    );

    if (enrollmentIndex !== -1) {
      enrollments[enrollmentIndex] = {
        ...enrollments[enrollmentIndex],
        progressPercent,
        status:
          progressPercent === 100
            ? EnrollmentStatus.COMPLETED
            : EnrollmentStatus.ACTIVE,
        completedAt: progressPercent === 100 ? new Date() : undefined,
      };

      this.enrollmentsSubject.next(enrollments);
    }
  }

  // Drop/unenroll from course
  dropCourse(courseId: string): Observable<boolean> {
    this.loadingSubject.next(true);

    return of(null).pipe(
      delay(500),
      map(() => {
        const currentUserId = '1'; // Mock current user ID
        const enrollments = this.enrollmentsSubject.value.filter(
          (e) => !(e.userId === currentUserId && e.courseId === courseId)
        );

        // Also remove progress records
        const progressRecords = this.progressSubject.value.filter(
          (p) => !(p.userId === currentUserId && p.courseId === courseId)
        );

        this.enrollmentsSubject.next(enrollments);
        this.progressSubject.next(progressRecords);
        this.loadingSubject.next(false);

        return true;
      }),
      catchError((error) => {
        this.loadingSubject.next(false);
        return throwError(() => error);
      })
    );
  }

  // Get enrollment statistics
  getEnrollmentStats(userId?: string): Observable<{
    totalEnrollments: number;
    activeEnrollments: number;
    completedCourses: number;
    averageProgress: number;
  }> {
    const currentUserId = userId || '1'; // Mock current user ID

    return this.getUserEnrollments(currentUserId).pipe(
      map((enrollments) => {
        const totalEnrollments = enrollments.length;
        const activeEnrollments = enrollments.filter(
          (e) => e.status === EnrollmentStatus.ACTIVE
        ).length;
        const completedCourses = enrollments.filter(
          (e) => e.status === EnrollmentStatus.COMPLETED
        ).length;
        const averageProgress =
          totalEnrollments > 0
            ? Math.round(
                enrollments.reduce((sum, e) => sum + e.progressPercent, 0) /
                  totalEnrollments
              )
            : 0;

        return {
          totalEnrollments,
          activeEnrollments,
          completedCourses,
          averageProgress,
        };
      })
    );
  }

  // Get recently accessed courses
  getRecentCourses(
    userId?: string,
    limit: number = 5
  ): Observable<Enrollment[]> {
    const currentUserId = userId || '1'; // Mock current user ID

    return this.getUserEnrollments(currentUserId).pipe(
      map((enrollments) =>
        enrollments
          .filter((e) => e.status === EnrollmentStatus.ACTIVE)
          .sort(
            (a, b) =>
              new Date(b.enrolledAt).getTime() -
              new Date(a.enrolledAt).getTime()
          )
          .slice(0, limit)
      )
    );
  }
}
