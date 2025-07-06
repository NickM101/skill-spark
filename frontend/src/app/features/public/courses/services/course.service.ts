// src/app/features/public/courses/services/course.service.ts

import { Injectable } from '@angular/core';
import { Category } from '@core/models/category.model';
import { Course, CourseFilters, CourseLevel, CourseResponse } from '@core/models/course.model';
import { MockDataService } from '@core/services/mock-data.service';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { delay, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class CourseService {
  private coursesSubject = new BehaviorSubject<Course[]>([]);
  public courses$ = this.coursesSubject.asObservable();

  private categoriesSubject = new BehaviorSubject<Category[]>([]);
  public categories$ = this.categoriesSubject.asObservable();

  constructor(private mockDataService: MockDataService) {
    this.loadInitialData();
  }

  private loadInitialData(): void {
    const courses = this.mockDataService.getCourses();
    const categories = this.mockDataService.getCategories();

    this.coursesSubject.next(courses);
    this.categoriesSubject.next(categories);
  }

  getCourses(filters?: CourseFilters): Observable<CourseResponse> {
    return of(null).pipe(
      delay(300), // Simulate API delay
      map(() => {
        let courses = this.mockDataService.getCourses();

        // Apply filters
        if (filters) {
          courses = this.applyFilters(courses, filters);
        }

        // Apply sorting
        if (filters?.sortBy) {
          courses = this.applySorting(
            courses,
            filters.sortBy || 'createdAt',
            filters.sortOrder || 'asc'
          );
        }

        // Apply pagination
        const page = filters?.page || 1;
        const limit = filters?.limit || 12;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const totalCount = courses.length;
        const totalPages = Math.ceil(totalCount / limit);
        const paginatedCourses = courses.slice(startIndex, endIndex);

        return {
          courses: paginatedCourses,
          totalCount,
          currentPage: page,
          totalPages,
        };
      })
    );
  }

  getCourseById(id: string): Observable<Course | null> {
    return of(null).pipe(
      delay(200),
      map(() => {
        const course = this.mockDataService.getCourseById(id);
        return course || null;
      })
    );
  }

  getCategories(): Observable<Category[]> {
    return of(null).pipe(
      delay(100),
      map(() => this.mockDataService.getCategories())
    );
  }

  getFeaturedCourses(limit: number = 6): Observable<Course[]> {
    return of(null).pipe(
      delay(200),
      map(() => {
        const courses = this.mockDataService.getCourses();
        return courses
          .filter((course) => course.isPublished)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
          .slice(0, limit);
      })
    );
  }

  searchCourses(query: string): Observable<Course[]> {
    return of(null).pipe(
      delay(300),
      map(() => this.mockDataService.searchCourses(query))
    );
  }

  getCoursesByCategory(categoryId: string): Observable<Course[]> {
    return of(null).pipe(
      delay(200),
      map(() => this.mockDataService.getCoursesByCategory(categoryId))
    );
  }

  private applyFilters(courses: Course[], filters: CourseFilters): Course[] {
    let filteredCourses = courses;

    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredCourses = filteredCourses.filter(
        (course) =>
          course.title.toLowerCase().includes(searchTerm) ||
          course.description?.toLowerCase().includes(searchTerm) ||
          course.category?.name.toLowerCase().includes(searchTerm) ||
          course.instructor?.firstName.toLowerCase().includes(searchTerm) ||
          course.instructor?.lastName.toLowerCase().includes(searchTerm)
      );
    }

    // Category filter
    if (filters.categoryId) {
      filteredCourses = filteredCourses.filter(
        (course) => course.categoryId === filters.categoryId
      );
    }

    // Level filter
    if (filters.level) {
      filteredCourses = filteredCourses.filter(
        (course) => course.level === filters.level
      );
    }

    // Price range filter
    if (filters?.minPrice !== undefined) {
      filteredCourses = filteredCourses.filter(
        (course) =>
          course.price !== undefined && course.price >= filters.minPrice!
      );
    }

    if (filters.maxPrice !== undefined) {
      filteredCourses = filteredCourses.filter(
        (course) =>
          course.price !== undefined && course.price <= filters.maxPrice!
      );
    }

    return filteredCourses;
  }

  private applySorting(
    courses: Course[],
    sortBy: 'title' | 'price' | 'createdAt' | 'level' | 'updatedAt' | 'enrollments',
    sortOrder: 'asc' | 'desc'
  ): Course[] {
    return courses.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'price':
          const priceA = a.price || 0;
          const priceB = b.price || 0;
          comparison = priceA - priceB;
          break;
        case 'createdAt':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'updatedAt':
          comparison = (a.updatedAt?.getTime?.() || 0) - (b.updatedAt?.getTime?.() || 0);
          break;
        case 'level':
          const levelOrder = {
            [CourseLevel.BEGINNER]: 1,
            [CourseLevel.INTERMEDIATE]: 2,
            [CourseLevel.ADVANCED]: 3,
          };
          comparison = levelOrder[a.level] - levelOrder[b.level];
          break;
        case 'enrollments':
          comparison = (Number(a.enrollments) || 0) - (Number(b.enrollments) || 0);
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }

  // Helper methods for getting enum values
  getCourseLevels(): CourseLevel[] {
    return Object.values(CourseLevel);
  }

  getLevelDisplayName(level: CourseLevel): string {
    switch (level) {
      case CourseLevel.BEGINNER:
        return 'Beginner';
      case CourseLevel.INTERMEDIATE:
        return 'Intermediate';
      case CourseLevel.ADVANCED:
        return 'Advanced';
      default:
        return level;
    }
  }

  getPriceRanges(): { label: string; min?: number; max?: number }[] {
    return [
      { label: 'Free', min: 0, max: 0 },
      { label: 'Under $50', min: 0.01, max: 49.99 },
      { label: '$50 - $100', min: 50, max: 100 },
      { label: 'Over $100', min: 100.01 },
    ];
  }
}
