// src/app/features/courses/services/course.service.ts

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
  finalize,
} from 'rxjs';
import {
  Course,
  CourseFilters,
  CourseListResponse,
  CreateCourseDto,
  UpdateCourseDto,
  Category,
  User,
  Lesson,
  CourseLevel,
  LessonType,
  Enrollment,
  EnrollmentStatus,
} from '../../../core/models/course.model';

@Injectable({
  providedIn: 'root',
})
export class CourseService {
  private coursesSubject = new BehaviorSubject<Course[]>([]);
  public courses$ = this.coursesSubject.asObservable();

  private categoriesSubject = new BehaviorSubject<Category[]>([]);
  public categories$ = this.categoriesSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData(): void {
    // Mock categories
    const mockCategories: Category[] = [
      {
        id: '1',
        name: 'Programming',
        description: 'Learn programming languages and frameworks',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: '2',
        name: 'Design',
        description: 'Master design principles and tools',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: '3',
        name: 'Business',
        description: 'Develop business and entrepreneurship skills',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: '4',
        name: 'Marketing',
        description: 'Learn digital marketing strategies',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ];

    // Mock instructor
    const mockInstructor: User = {
      id: '2',
      email: 'jane@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'INSTRUCTOR',
      isEmailVerified: true,
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    // Mock lessons
    const jsLessons: Lesson[] = [
      {
        id: '1',
        title: 'Introduction to JavaScript',
        content:
          "Welcome to JavaScript! In this lesson, we'll cover the basics of JavaScript programming language.",
        type: LessonType.VIDEO,
        videoUrl: 'https://youtube.com/watch?v=example1',
        orderIndex: 0,
        courseId: '1',
        isPublished: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: '2',
        title: 'Variables and Data Types',
        content:
          'Learn about JavaScript variables and different data types including strings, numbers, booleans, and objects.',
        type: LessonType.TEXT,
        orderIndex: 1,
        courseId: '1',
        isPublished: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: '3',
        title: 'Functions and Scope',
        content:
          'Understanding how to write and use functions in JavaScript, including function declarations, expressions, and arrow functions.',
        type: LessonType.VIDEO,
        videoUrl: 'https://youtube.com/watch?v=example2',
        orderIndex: 2,
        courseId: '1',
        isPublished: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
      {
        id: '4',
        title: 'JavaScript Cheat Sheet',
        content:
          'Comprehensive cheat sheet covering all JavaScript fundamentals.',
        type: LessonType.PDF,
        fileUrl: 'https://example.com/js-cheatsheet.pdf',
        orderIndex: 3,
        courseId: '1',
        isPublished: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ];

    // Mock courses
    const mockCourses: Course[] = [
      {
        id: '1',
        title: 'JavaScript Fundamentals',
        description:
          'Master the basics of JavaScript programming language. Learn variables, functions, objects, and modern ES6+ features.',
        thumbnail:
          'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400',
        price: 49.99,
        level: CourseLevel.BEGINNER,
        categoryId: '1',
        instructorId: '2',
        isPublished: true,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        category: mockCategories[0],
        instructor: mockInstructor,
        lessons: jsLessons,
      },
      {
        id: '2',
        title: 'React Development Masterclass',
        description:
          'Build modern web applications with React. Learn components, hooks, state management, and best practices.',
        thumbnail:
          'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400',
        price: 79.99,
        level: CourseLevel.INTERMEDIATE,
        categoryId: '1',
        instructorId: '2',
        isPublished: true,
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-20'),
        category: mockCategories[0],
        instructor: mockInstructor,
        lessons: [
          {
            id: '5',
            title: 'React Basics',
            content: 'Getting started with React and understanding components.',
            type: LessonType.VIDEO,
            videoUrl: 'https://youtube.com/watch?v=react1',
            orderIndex: 0,
            courseId: '2',
            isPublished: true,
            createdAt: new Date('2024-01-20'),
            updatedAt: new Date('2024-01-20'),
          },
        ],
      },
      {
        id: '3',
        title: 'UI/UX Design Principles',
        description:
          'Master the fundamentals of user interface and experience design. Learn design thinking, prototyping, and user research.',
        thumbnail:
          'https://images.unsplash.com/photo-1586717791821-3f44a563fa4c?w=400',
        price: 59.99,
        level: CourseLevel.BEGINNER,
        categoryId: '2',
        instructorId: '2',
        isPublished: true,
        createdAt: new Date('2024-01-25'),
        updatedAt: new Date('2024-01-25'),
        category: mockCategories[1],
        instructor: mockInstructor,
        lessons: [],
      },
      {
        id: '4',
        title: 'Digital Marketing Strategy',
        description:
          'Learn effective digital marketing techniques including SEO, social media marketing, and content strategy.',
        thumbnail:
          'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400',
        price: 69.99,
        level: CourseLevel.INTERMEDIATE,
        categoryId: '4',
        instructorId: '2',
        isPublished: true,
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-01'),
        category: mockCategories[3],
        instructor: mockInstructor,
        lessons: [],
      },
      {
        id: '5',
        title: 'Advanced Angular Development',
        description:
          'Deep dive into Angular framework with advanced concepts like RxJS, NgRx, and performance optimization.',
        thumbnail:
          'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400',
        price: 99.99,
        level: CourseLevel.ADVANCED,
        categoryId: '1',
        instructorId: '2',
        isPublished: true,
        createdAt: new Date('2024-02-05'),
        updatedAt: new Date('2024-02-05'),
        category: mockCategories[0],
        instructor: mockInstructor,
        lessons: [],
      },
      {
        id: '6',
        title: 'Business Analytics Fundamentals',
        description:
          'Learn data analysis and business intelligence tools to make data-driven decisions.',
        thumbnail:
          'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
        price: 54.99,
        level: CourseLevel.BEGINNER,
        categoryId: '3',
        instructorId: '2',
        isPublished: true,
        createdAt: new Date('2024-02-10'),
        updatedAt: new Date('2024-02-10'),
        category: mockCategories[2],
        instructor: mockInstructor,
        lessons: [],
      },
    ];

    this.categoriesSubject.next(mockCategories);
    this.coursesSubject.next(mockCourses);
  }

  // Get all courses with optional filtering
  getCourses(
    filters?: CourseFilters,
    page: number = 1,
    limit: number = 10
  ): Observable<CourseListResponse> {
    this.loadingSubject.next(true);

    return of(null).pipe(
      delay(500),
      map(() => {
        let filteredCourses = this.coursesSubject.value.filter(
          (course) => course.isPublished
        );

        console.log("FILTERED", filteredCourses)
        // Apply filters
        if (filters) {
          if (filters.categoryId) {
            filteredCourses = filteredCourses.filter(
              (course) => course.categoryId === filters.categoryId
            );
          }
          if (filters.level) {
            filteredCourses = filteredCourses.filter(
              (course) => course.level === filters.level
            );
          }
          if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filteredCourses = filteredCourses.filter(
              (course) =>
                course.title.toLowerCase().includes(searchTerm) ||
                course.description?.toLowerCase().includes(searchTerm) ||
                course.instructor?.firstName
                  .toLowerCase()
                  .includes(searchTerm) ||
                course.instructor?.lastName.toLowerCase().includes(searchTerm)
            );
          }
          if (filters.minPrice !== undefined) {
            filteredCourses = filteredCourses.filter(
              (course) => (course.price || 0) >= filters.minPrice!
            );
          }
          if (filters.maxPrice !== undefined) {
            filteredCourses = filteredCourses.filter(
              (course) => (course.price || 0) <= filters.maxPrice!
            );
          }
          if (filters.instructorId) {
            filteredCourses = filteredCourses.filter(
              (course) => course.instructorId === filters.instructorId
            );
          }
        }

        // Pagination
        const startIndex = (page - 1) * limit;
        const paginatedCourses = filteredCourses.slice(
          startIndex,
          startIndex + limit
        );
        const totalPages = Math.ceil(filteredCourses.length / limit);

        this.loadingSubject.next(false);

        console.log("FILTERED COURSES", paginatedCourses)

        return {
          courses: paginatedCourses,
          total: filteredCourses.length,
          page,
          limit,
          totalPages,
        };
      }),
      finalize(() => this.loadingSubject.next(false)),
      catchError((error) => {
        this.loadingSubject.next(false);
        return throwError(() => error);
      })
    );
  }

  // Get course by ID
  getCourseById(id: string): Observable<Course | null> {
    this.loadingSubject.next(true);

    return of(null).pipe(
      delay(300),
      map(() => {
        const course =
          this.coursesSubject.value.find((c) => c.id === id) || null;
        this.loadingSubject.next(false);
        return course;
      }),
      catchError((error) => {
        this.loadingSubject.next(false);
        return throwError(() => error);
      })
    );
  }

  // Get featured courses
  getFeaturedCourses(limit: number = 6): Observable<Course[]> {
    return this.getCourses({}, 1, limit).pipe(
      map((response) => response.courses)
    );
  }

  // Get courses by instructor
  getCoursesByInstructor(instructorId: string): Observable<Course[]> {
    return of(null).pipe(
      delay(300),
      map(() => {
        return this.coursesSubject.value.filter(
          (course) => course.instructorId === instructorId
        );
      })
    );
  }

  // Create new course (for instructors)
  createCourse(courseData: CreateCourseDto): Observable<Course> {
    this.loadingSubject.next(true);

    return of(null).pipe(
      delay(1000),
      map(() => {
        const newCourse: Course = {
          id: Date.now().toString(),
          ...courseData,
          instructorId: '2', // Mock current user ID
          isPublished: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const courses = [...this.coursesSubject.value, newCourse];
        this.coursesSubject.next(courses);
        this.loadingSubject.next(false);

        return newCourse;
      }),
      catchError((error) => {
        this.loadingSubject.next(false);
        return throwError(() => error);
      })
    );
  }

  // Update course
  updateCourse(id: string, courseData: UpdateCourseDto): Observable<Course> {
    this.loadingSubject.next(true);

    return of(null).pipe(
      delay(800),
      map(() => {
        const courses = this.coursesSubject.value;
        const courseIndex = courses.findIndex((c) => c.id === id);

        if (courseIndex === -1) {
          throw new Error('Course not found');
        }

        const updatedCourse = {
          ...courses[courseIndex],
          ...courseData,
          updatedAt: new Date(),
        };

        courses[courseIndex] = updatedCourse;
        this.coursesSubject.next([...courses]);
        this.loadingSubject.next(false);

        return updatedCourse;
      }),
      catchError((error) => {
        this.loadingSubject.next(false);
        return throwError(() => error);
      })
    );
  }

  // Delete course
  deleteCourse(id: string): Observable<boolean> {
    this.loadingSubject.next(true);

    return of(null).pipe(
      delay(500),
      map(() => {
        const courses = this.coursesSubject.value.filter((c) => c.id !== id);
        this.coursesSubject.next(courses);
        this.loadingSubject.next(false);
        return true;
      }),
      catchError((error) => {
        this.loadingSubject.next(false);
        return throwError(() => error);
      })
    );
  }

  // Get all categories
  getCategories(): Observable<Category[]> {
    return this.categories$;
  }

  // Search courses
  searchCourses(query: string): Observable<Course[]> {
    return this.getCourses({ search: query }, 1, 50).pipe(
      map((response) => response.courses)
    );
  }

  // Get course levels enum
  getCourseLevels(): CourseLevel[] {
    return Object.values(CourseLevel);
  }

  // Get lesson types enum
  getLessonTypes(): LessonType[] {
    return Object.values(LessonType);
  }
}
