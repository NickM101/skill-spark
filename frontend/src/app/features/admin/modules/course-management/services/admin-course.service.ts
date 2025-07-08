import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, forkJoin } from 'rxjs';
import { map, tap, catchError, switchMap, finalize } from 'rxjs/operators';

import { ApiService } from '@core/services/api.service';
import { Category } from '@core/models/category.model';
import { User } from '@core/models/user.model';
import {
  CourseLevel,
  Course,
  CourseStats,
  CourseListResponse,
  CreateCourseRequest,
  UpdateCourseRequest,
} from '@core/models/course.model';
import { CategoryService } from '../../category-management/services/category.service';

export interface CourseQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  level?: CourseLevel;
  isPublished?: boolean;
  instructorId?: string;
  sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'enrollments' | 'price';
  sortOrder?: 'asc' | 'desc';
}

export interface AssignInstructorRequest {
  instructorId: string;
}

@Injectable({
  providedIn: 'root',
})
export class CourseService {
  private coursesSubject = new BehaviorSubject<Course[]>([]);
  private instructorsSubject = new BehaviorSubject<User[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  public courses$ = this.coursesSubject.asObservable();
  public instructors$ = this.instructorsSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  constructor(
    private apiService: ApiService,
    private categoryService: CategoryService
  ) {}

  // ----------------------
  // Public CRUD Methods
  // ----------------------

  /**
   * Get all courses with optional filtering and pagination
   */
  getCourses(params: CourseQueryParams = {}): Observable<CourseListResponse> {
    this.loadingSubject.next(true);

    const queryParams = {
      page: params.page || 1,
      limit: params.limit || 10,
      ...(params.search && { search: params.search }),
      ...(params.categoryId && { categoryId: params.categoryId }),
      ...(params.level && { level: params.level }),
      ...(params.isPublished !== undefined && {
        isPublished: params.isPublished,
      }),
      ...(params.instructorId && { instructorId: params.instructorId }),
      ...(params.sortBy && { sortBy: params.sortBy }),
      ...(params.sortOrder && { sortOrder: params.sortOrder }),
    };

    return this.apiService.get<Course[]>('/courses', queryParams).pipe(
      map((response) => {
        const { items, pagination } =
          this.apiService.extractPaginatedData(response);

        // Update local state
        this.coursesSubject.next(items);

        return {
          courses: items,
          total: pagination.total,
          page: pagination.page,
          limit: pagination.limit,
          totalPages: pagination.totalPages,
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
   * Get instructor's courses
   */
  getMyCourses(params: CourseQueryParams = {}): Observable<CourseListResponse> {
    this.loadingSubject.next(true);

    const queryParams = {
      page: params.page || 1,
      limit: params.limit || 10,
      ...(params.search && { search: params.search }),
      ...(params.categoryId && { categoryId: params.categoryId }),
      ...(params.level && { level: params.level }),
      ...(params.isPublished !== undefined && {
        isPublished: params.isPublished,
      }),
      ...(params.sortBy && { sortBy: params.sortBy }),
      ...(params.sortOrder && { sortOrder: params.sortOrder }),
    };

    return this.apiService
      .get<Course[]>('/courses/my-courses', queryParams)
      .pipe(
        map((response) => {
          const { items, pagination } =
            this.apiService.extractPaginatedData(response);

          return {
            courses: items,
            total: pagination.total,
            page: pagination.page,
            limit: pagination.limit,
            totalPages: pagination.totalPages,
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
   * Get a single course by ID
   */
  getCourse(id: string): Observable<Course> {
    this.loadingSubject.next(true);

    return this.apiService.get<Course>(`/courses/${id}`).pipe(
      map((response) => this.apiService.extractData(response)!),
      tap(() => this.loadingSubject.next(false)),
      catchError((error) => {
        this.loadingSubject.next(false);
        throw error;
      })
      
    );
  }

  /**
   * Create a new course (Admin only)
   */
  createCourse(request: CreateCourseRequest): Observable<Course> {
    this.loadingSubject.next(true);

    const createDto = {
      title: request.title,
      description: request.description,
      categoryId: request.categoryId,
      level: request.level,
      price: request.price,
      ...(request.instructorId && { instructorId: request.instructorId }),
    };

    return this.apiService.post<Course>('/courses', createDto).pipe(
      map((response) => {
        const newCourse = this.apiService.extractData(response)!;

        // Update local state
        const currentCourses = this.coursesSubject.value;
        this.coursesSubject.next([newCourse, ...currentCourses]);

        return newCourse;
      }),
      tap(() => this.loadingSubject.next(false)),
      catchError((error) => {
        this.loadingSubject.next(false);
        throw error;
      })
    );
  }

  /**
   * Update an existing course
   */
  updateCourse(id: string, request: UpdateCourseRequest): Observable<Course> {
    this.loadingSubject.next(true);

    const updateDto = {
      ...(request.title !== undefined && { title: request.title }),
      ...(request.description !== undefined && {
        description: request.description,
      }),
      ...(request.categoryId !== undefined && {
        categoryId: request.categoryId,
      }),
      ...(request.level !== undefined && { level: request.level }),
      ...(request.price !== undefined && { price: request.price }),
      ...(request.instructorId !== undefined && {
        instructorId: request.instructorId,
      }),
    };

    return this.apiService.patch<Course>(`/courses/${id}`, updateDto).pipe(
      map((response) => {
        const updatedCourse = this.apiService.extractData(response)!;

        // Update local state
        this.updateCourseInState(updatedCourse);

        return updatedCourse;
      }),
      tap(() => this.loadingSubject.next(false)),
      catchError((error) => {
        this.loadingSubject.next(false);
        throw error;
      })
    );
  }

  /**
   * Assign instructor to course (Admin only)
   */
  assignInstructor(courseId: string, instructorId: string): Observable<Course> {
    this.loadingSubject.next(true);

    const assignDto: AssignInstructorRequest = { instructorId };

    return this.apiService
      .patch<Course>(`/courses/${courseId}/assign-instructor`, assignDto)
      .pipe(
        map((response) => {
          const updatedCourse = this.apiService.extractData(response)!;

          // Update local state
          this.updateCourseInState(updatedCourse);

          return updatedCourse;
        }),
        tap(() => this.loadingSubject.next(false)),
        catchError((error) => {
          this.loadingSubject.next(false);
          throw error;
        })
      );
  }

  /**
   * Publish a course
   */
  publishCourse(id: string): Observable<Course> {
    this.loadingSubject.next(true);

    return this.apiService.post<Course>(`/courses/${id}/publish`, {}).pipe(
      map((response) => {
        const publishedCourse = this.apiService.extractData(response)!;

        // Update local state
        this.updateCourseInState(publishedCourse);

        return publishedCourse;
      }),
      tap(() => this.loadingSubject.next(false)),
      catchError((error) => {
        this.loadingSubject.next(false);
        throw error;
      })
    );
  }

  /**
   * Unpublish a course
   */
  unpublishCourse(id: string): Observable<Course> {
    this.loadingSubject.next(true);

    return this.apiService.post<Course>(`/courses/${id}/unpublish`, {}).pipe(
      map((response) => {
        const unpublishedCourse = this.apiService.extractData(response)!;

        // Update local state
        this.updateCourseInState(unpublishedCourse);

        return unpublishedCourse;
      }),
      tap(() => this.loadingSubject.next(false)),
      catchError((error) => {
        this.loadingSubject.next(false);
        throw error;
      })
    );
  }

  /**
   * Upload course thumbnail
   */
  uploadCourseThumbnail(courseId: string, file: File): Observable<Course> {
    this.loadingSubject.next(true);

    const formData = new FormData();
    formData.append('thumbnail', file);

    return this.apiService
      .upload<Course>(`/courses/${courseId}/thumbnail`, formData)
      .pipe(
        map((response) => {
          const updatedCourse = this.apiService.extractData(response)!;

          // Update local state
          this.updateCourseInState(updatedCourse);

          return updatedCourse;
        }),
        tap(() => this.loadingSubject.next(false)),
        catchError((error) => {
          this.loadingSubject.next(false);
          throw error;
        })
      );
  }

  /**
   * Delete a course (Admin only)
   */
  deleteCourse(id: string): Observable<void> {
    this.loadingSubject.next(true);

    return this.apiService.delete<null>(`/courses/${id}`).pipe(
      map(() => {
        // Update local state
        this.removeCourseFromState(id);

        return void 0;
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
   * Search courses
   */
  searchCourses(
    searchTerm: string,
    filters: Omit<CourseQueryParams, 'search'> = {}
  ): Observable<CourseListResponse> {
    return this.getCourses({ ...filters, search: searchTerm });
  }

  /**
   * Get courses by category
   */
  getCoursesByCategory(
    categoryId: string,
    params: CourseQueryParams = {}
  ): Observable<CourseListResponse> {
    return this.getCourses({ ...params, categoryId });
  }

  /**
   * Get courses by instructor
   */
  getCoursesByInstructor(
    instructorId: string,
    params: CourseQueryParams = {}
  ): Observable<CourseListResponse> {
    return this.getCourses({ ...params, instructorId });
  }

  /**
   * Get published courses only
   */
  getPublishedCourses(
    params: CourseQueryParams = {}
  ): Observable<CourseListResponse> {
    return this.getCourses({ ...params, isPublished: true });
  }

  /**
   * Get draft courses only
   */
  getDraftCourses(
    params: CourseQueryParams = {}
  ): Observable<CourseListResponse> {
    return this.getCourses({ ...params, isPublished: false });
  }

  /**
   * Get course statistics
   */
  getCourseStats(): Observable<CourseStats> {
    return this.courses$.pipe(
      map((courses) => {
        const publishedCourses = courses.filter((c) => c.isPublished);
        const totalEnrollments = courses.reduce(
          (sum, c) => sum + (c._count?.enrollments || 0),
          0
        );
        const totalRevenue = courses.reduce(
          (sum, c) => sum + (c.price || 0) * (c._count?.enrollments || 0),
          0
        );

        return {
          totalCourses: courses.length,
          publishedCourses: publishedCourses.length,
          draftCourses: courses.length - publishedCourses.length,
          totalEnrollments,
          totalRevenue,
          avgRating: 4.2, // This would come from reviews in a real implementation
        };
      })
    );
  }

  /**
   * Get categories for course creation/editing
   */
  getCategories(): Observable<Category[]> {
    return this.categoryService.getAllCategories();
  }

  /**
   * Get instructors for course assignment
   */
  getInstructors(): Observable<User[]> {
    // This would typically be a separate API call to get users with INSTRUCTOR role
    // For now, we'll return the cached instructors
    return this.instructors$;
  }

  /**
   * Load instructors from API (if you have a users endpoint)
   */
  loadInstructors(): Observable<User[]> {
    this.loadingSubject.next(true);

    // Assuming you have a users endpoint that can filter by role
    return this.apiService.get<User[]>('/users', { role: 'INSTRUCTOR' }).pipe(
      map((response) => {
        const instructors = this.apiService.extractData(response) || [];
        this.instructorsSubject.next(instructors);
        return instructors;
      }),
      tap(() => this.loadingSubject.next(false)),
      catchError((error) => {
        this.loadingSubject.next(false);
        throw error;
      })
    );
  }

  /**
   * Refresh courses from server
   */
  refreshCourses(): Observable<CourseListResponse> {
    return this.getCourses();
  }

  /**
   * Check if course title exists
   */
  courseTitleExists(title: string, excludeId?: string): Observable<boolean> {
    return this.courses$.pipe(
      map((courses) => {
        return courses.some(
          (course) =>
            course.title.toLowerCase() === title.toLowerCase() &&
            course.id !== excludeId
        );
      })
    );
  }

  /**
   * Get courses with full data (categories and instructors loaded)
   */
  getCoursesWithFullData(
    params: CourseQueryParams = {}
  ): Observable<CourseListResponse> {
    return forkJoin({
      courses: this.getCourses(params),
      categories: this.getCategories(),
      instructors: this.getInstructors(),
    }).pipe(map(({ courses }) => courses));
  }

  // ----------------------
  // State Management
  // ----------------------

  /**
   * Clear local state
   */
  clearCourses(): void {
    this.coursesSubject.next([]);
  }

  /**
   * Get current courses from local state
   */
  getCurrentCourses(): Course[] {
    return this.coursesSubject.value;
  }

  /**
   * Update a single course in local state
   */
  updateCourseInState(course: Course): void {
    const currentCourses = this.coursesSubject.value;
    const index = currentCourses.findIndex((c) => c.id === course.id);

    if (index !== -1) {
      const updatedCourses = [...currentCourses];
      updatedCourses[index] = course;
      this.coursesSubject.next(updatedCourses);
    }
  }

  /**
   * Add a course to local state
   */
  addCourseToState(course: Course): void {
    const currentCourses = this.coursesSubject.value;
    this.coursesSubject.next([course, ...currentCourses]);
  }

  /**
   * Remove a course from local state
   */
  removeCourseFromState(id: string): void {
    const currentCourses = this.coursesSubject.value;
    const updatedCourses = currentCourses.filter((c) => c.id !== id);
    this.coursesSubject.next(updatedCourses);
  }

  /**
   * Update course publication status in state
   */
  updateCoursePublicationStatus(id: string, isPublished: boolean): void {
    const currentCourses = this.coursesSubject.value;
    const index = currentCourses.findIndex((c) => c.id === id);

    if (index !== -1) {
      const updatedCourses = [...currentCourses];
      updatedCourses[index] = {
        ...updatedCourses[index],
        isPublished,
        updatedAt: new Date(),
      };
      this.coursesSubject.next(updatedCourses);
    }
  }

  /**
   * Get course by ID from local state
   */
  getCourseFromState(id: string): Course | undefined {
    return this.coursesSubject.value.find((c) => c.id === id);
  }

  // ----------------------
  // Validation Helpers
  // ----------------------

  /**
   * Validate course data before submission
   */
  validateCourseData(
    courseData: CreateCourseRequest | UpdateCourseRequest
  ): string[] {
    const errors: string[] = [];

    if (
      'title' in courseData &&
      (!courseData.title || courseData.title.trim().length < 3)
    ) {
      errors.push('Course title must be at least 3 characters long');
    }

    if (
      'title' in courseData &&
      courseData.title &&
      courseData.title.length > 100
    ) {
      errors.push('Course title cannot exceed 100 characters');
    }

    if (
      'description' in courseData &&
      courseData.description &&
      courseData.description.length > 1000
    ) {
      errors.push('Course description cannot exceed 1000 characters');
    }

    if (
      'price' in courseData &&
      courseData.price !== undefined &&
      courseData.price < 0
    ) {
      errors.push('Course price cannot be negative');
    }

    if ('categoryId' in courseData && !courseData.categoryId) {
      errors.push('Category is required');
    }

    return errors;
  }

  /**
   * Check if user can edit course
   */
  canEditCourse(course: Course, userRole: string, userId: string): boolean {
    return (
      userRole === 'ADMIN' ||
      (userRole === 'INSTRUCTOR' && course.instructorId === userId)
    );
  }

  /**
   * Check if user can delete course
   */
  canDeleteCourse(userRole: string): boolean {
    return userRole === 'ADMIN';
  }

  /**
   * Check if course can be published
   */
  canPublishCourse(course: Course): boolean {
    // Add your business logic here
    return !!(
      course.title &&
      course.description &&
      course.categoryId &&
      course.instructorId
    );
  }
}
