// src/app/features/public/courses/services/course.service.ts

import { Injectable } from '@angular/core';
import { BehaviorSubject, of, Observable } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';

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
import { CategoryService } from '@core/services/category.service';

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

@Injectable({
  providedIn: 'root',
})
export class CourseService {
  private coursesSubject = new BehaviorSubject<Course[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  public courses$ = this.coursesSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public Categories: Category[] = []; // This should be initialized with actual categories
  constructor(
    private apiService: ApiService,
    private categoryService: CategoryService
  ) {}

  // ----------------------
  // Student Methods
  // ----------------------

  /**
   * Get all published courses with optional filtering and pagination
   */
  getCourses(params: CourseQueryParams = {}): Observable<CourseListResponse> {
    this.loadingSubject.next(true);

    const queryParams = {
      page: params.page || 1,
      limit: params.limit || 10,
      ...(params.search && { search: params.search }),
      ...(params.categoryId && { categoryId: params.categoryId }),
      ...(params.level && { level: params.level }),
      isPublished: true, // Always fetch only published courses for students
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
   * Get a single published course by ID
   */
  getCourseById(id: string): Observable<Course> {
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
   * Search published courses
   */
  searchCourses(
    searchTerm: string,
    filters: Omit<CourseQueryParams, 'search'> = {}
  ): Observable<CourseListResponse> {
    return this.getCourses({ ...filters, search: searchTerm });
  }

  /**
   * Get published courses by category
   */
  getCoursesByCategory(
    categoryId: string,
    params: CourseQueryParams = {}
  ): Observable<CourseListResponse> {
    return this.getCourses({ ...params, categoryId });
  }

  /**
   * Get published courses by instructor
   */
  getCoursesByInstructor(
    instructorId: string,
    params: CourseQueryParams = {}
  ): Observable<CourseListResponse> {
    return this.getCourses({ ...params, instructorId });
  }

  /**
   * Refresh courses from server
   */
  refreshCourses(): Observable<CourseListResponse> {
    return this.getCourses();
  }

  /**
   * Get categories for course filtering
   */
  getCategories(): Observable<Category[]> {
    return of(this.Categories); // this.categories is your Category[] array
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
}
