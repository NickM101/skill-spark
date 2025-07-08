import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import {
  ApiService,
  ApiResponse,
} from '../../../../../core/services/api.service';
import { CreateEnrollmentDto, Enrollment, EnrollmentFilters, UpdateEnrollmentDto } from '@core/models/enrollment.model';
import { Progress } from '@core/models/progress.model';
import { EnrollmentStats } from '@features/admin/components/admin-dashboard/admin-dashboard';
import { CourseProgress } from '@core/models/course.model';

@Injectable({
  providedIn: 'root',
})
export class EnrollmentService {
  private readonly baseEndpoint = '/enrollments';
  private enrollmentsSubject = new BehaviorSubject<Enrollment[]>([]);
  public enrollments$ = this.enrollmentsSubject.asObservable();

  constructor(private apiService: ApiService) {}

  /**
   * Create a new enrollment
   */
  createEnrollment(dto: CreateEnrollmentDto): Observable<Enrollment> {
    return this.apiService.post<Enrollment>(this.baseEndpoint, dto).pipe(
      map((response) => response.data),
      tap(() => this.refreshEnrollments())
    );
  }

  /**
   * Get all enrollments with filters and pagination
   */
  getAllEnrollments(filters: EnrollmentFilters = {}): Observable<{
    enrollments: Enrollment[];
    pagination: any;
  }> {
    const params = this.buildQueryParams(filters);
    return this.apiService.get<Enrollment[]>(this.baseEndpoint, params).pipe(
      map((response) => ({
        enrollments: response.data || [],
        pagination: response.meta,
      })),
      tap((result) => this.enrollmentsSubject.next(result.enrollments))
    );
  }

  /**
   * Get current user's enrollments (for students)
   */
  getMyEnrollments(
    page = 1,
    limit = 10
  ): Observable<{
    enrollments: Enrollment[];
    pagination: any;
  }> {
    const params = { page, limit };
    return this.apiService
      .get<Enrollment[]>(`${this.baseEndpoint}/my-enrollments`, params)
      .pipe(
        map((response) => ({
          enrollments: response.data || [],
          pagination: response.meta,
        }))
      );
  }

  /**
   * Get enrollments for a specific course
   */
  getCourseEnrollments(
    courseId: string,
    page = 1,
    limit = 10
  ): Observable<{
    enrollments: Enrollment[];
    pagination: any;
  }> {
    const params = { page, limit };
    return this.apiService
      .get<Enrollment[]>(`${this.baseEndpoint}/course/${courseId}`, params)
      .pipe(
        map((response) => ({
          enrollments: response.data || [],
          pagination: response.meta,
        }))
      );
  }

  /**
   * Get a single enrollment by ID
   */
  getEnrollmentById(id: string): Observable<Enrollment> {
    return this.apiService
      .get<Enrollment>(`${this.baseEndpoint}/${id}`)
      .pipe(map((response) => response.data));
  }

  /**
   * Get enrollment progress
   */
  getEnrollmentProgress(id: string): Observable<{
    enrollment: Enrollment;
    progress: Progress[];
    stats: any;
  }> {
    return this.apiService
      .get<any>(`${this.baseEndpoint}/${id}/progress`)
      .pipe(map((response) => response.data));
  }

  /**
   * Update enrollment
   */
  updateEnrollment(
    id: string,
    dto: UpdateEnrollmentDto
  ): Observable<Enrollment> {
    return this.apiService
      .patch<Enrollment>(`${this.baseEndpoint}/${id}`, dto)
      .pipe(
        map((response) => response.data),
        tap(() => this.refreshEnrollments())
      );
  }

  /**
   * Delete/Drop enrollment
   */
  deleteEnrollment(id: string): Observable<void> {
    return this.apiService.delete<void>(`${this.baseEndpoint}/${id}`).pipe(
      map((response) => response.data),
      tap(() => this.refreshEnrollments())
    );
  }

  /**
   * Get enrollment statistics (admin only)
   */
  getEnrollmentStats(): Observable<EnrollmentStats> {
    return this.apiService
      .get<EnrollmentStats>(`${this.baseEndpoint}/stats`)
      .pipe(map((response) => response.data));
  }

  /**
   * Export enrollments data
   */
  exportEnrollments(filters: EnrollmentFilters = {}): Observable<Blob> {
    const params = this.buildQueryParams(filters);
    return this.apiService
      .get<Blob>(`${this.baseEndpoint}/export`, params)
      .pipe(map((response) => response.data));
  }

  /**
   * Bulk update enrollments
   */
  bulkUpdateEnrollments(
    enrollmentIds: string[],
    updateData: Partial<UpdateEnrollmentDto>
  ): Observable<void> {
    const payload = {
      enrollmentIds,
      updateData,
    };
    return this.apiService
      .patch<void>(`${this.baseEndpoint}/bulk-update`, payload)
      .pipe(
        map((response) => response.data),
        tap(() => this.refreshEnrollments())
      );
  }

  /**
   * Search enrollments
   */
  searchEnrollments(
    query: string,
    filters: Partial<EnrollmentFilters> = {}
  ): Observable<{
    enrollments: Enrollment[];
    pagination: any;
  }> {
    const params = {
      ...this.buildQueryParams(filters),
      search: query,
    };
    return this.apiService
      .get<Enrollment[]>(`${this.baseEndpoint}/search`, params)
      .pipe(
        map((response) => ({
          enrollments: response.data || [],
          pagination: response.meta,
        }))
      );
  }

  /**
   * Mark lesson as complete
   */
  markLessonComplete(lessonId: string, courseId: string): Observable<void> {
    const payload = { courseId };
    return this.apiService
      .post<void>(`/progress/lessons/${lessonId}/complete`, payload)
      .pipe(map((response) => response.data));
  }

  /**
   * Mark lesson as incomplete
   */
  markLessonIncomplete(lessonId: string, courseId: string): Observable<void> {
    const payload = { courseId };
    return this.apiService
      .delete<void>(`/progress/lessons/${lessonId}/complete`)
      .pipe(map((response) => response.data));
  }

  /**
   * Get user progress for a course
   */
  getUserProgress(courseId: string): Observable<CourseProgress> {
    return this.apiService
      .get<CourseProgress>(`/progress/courses/${courseId}`)
      .pipe(map((response) => response.data));
  }

  /**
   * Get course progress for all students (instructor/admin)
   */
  getCourseProgressForStudents(courseId: string): Observable<CourseProgress> {
    return this.apiService
      .get<CourseProgress>(`/progress/courses/${courseId}/students`)
      .pipe(map((response) => response.data));
  }

  /**
   * Get progress statistics
   */
  getProgressStats(): Observable<any> {
    return this.apiService
      .get<any>(`/progress/stats`)
      .pipe(map((response) => response.data));
  }

  // Helper methods
  private buildQueryParams(filters: EnrollmentFilters): any {
    const params: any = {};

    if (filters.page) params.page = filters.page;
    if (filters.limit) params.limit = filters.limit;
    if (filters.courseId) params.courseId = filters.courseId;
    if (filters.status) params.status = filters.status;
    if (filters.search) params.search = filters.search;
    if (filters.userId) params.userId = filters.userId;
    if (filters.sortBy) params.sortBy = filters.sortBy;
    if (filters.sortOrder) params.sortOrder = filters.sortOrder;

    return params;
  }

  private refreshEnrollments(): void {
    // Refresh the current enrollments list
    this.getAllEnrollments().subscribe();
  }

  // Utility methods for components
  getEnrollmentStatusColor(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'primary';
      case 'COMPLETED':
        return 'accent';
      case 'DROPPED':
        return 'warn';
      default:
        return 'basic';
    }
  }

  getProgressColor(progress: number): string {
    if (progress >= 80) return 'accent';
    if (progress >= 50) return 'primary';
    if (progress >= 20) return 'warn';
    return 'basic';
  }

  formatProgress(progress: number): string {
    return `${Math.round(progress)}%`;
  }

  getEnrollmentDuration(enrolledAt: string | Date, completedAt?: string | Date): string {
    const start = new Date(enrolledAt);
    const end = completedAt ? new Date(completedAt) : new Date();
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) return `${diffDays} days`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
    return `${Math.floor(diffDays / 365)} years`;
  }
}
