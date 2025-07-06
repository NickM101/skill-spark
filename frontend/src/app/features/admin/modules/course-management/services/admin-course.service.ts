// src/app/features/admin/modules/course-management/services/admin-course.service.ts

import { Injectable } from '@angular/core';
import { Category } from '@core/models/category.model';
import { Course, CourseLevel, CourseFilters, CourseStats } from '@core/models/course.model';
import { User, Role } from '@core/models/user.model';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay, map, tap } from 'rxjs/operators';


@Injectable({
  providedIn: 'root',
})
export class AdminCourseService {
  private coursesSubject = new BehaviorSubject<Course[]>([]);
  private categoriesSubject = new BehaviorSubject<Category[]>([]);
  private instructorsSubject = new BehaviorSubject<User[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  public courses$ = this.coursesSubject.asObservable();
  public categories$ = this.categoriesSubject.asObservable();
  public instructors$ = this.instructorsSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  // Mock Data

  private mockCategories: Category[] = [
    {
      id: 'cat_1',
      name: 'Programming',
      description: 'Learn programming languages and frameworks',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-05'),
    },
    {
      id: 'cat_2',
      name: 'Design',
      description: 'Master design principles and tools',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-06'),
    },
    {
      id: 'cat_3',
      name: 'Business',
      description: 'Develop business and entrepreneurship skills',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-07'),
    },
    {
      id: 'cat_4',
      name: 'Marketing',
      description: 'Learn digital marketing strategies',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-08'),
    },
  ];

  private mockInstructors: User[] = [
    {
      id: 'inst_1',
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
      fullName: 'John Doe',
      role: Role.INSTRUCTOR,
      isEmailVerified: true,
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-03'),
      courseCount: 2,
      enrollmentCount: 77,
    },
    {
      id: 'inst_2',
      email: 'jane.smith@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      fullName: 'Jane Smith',
      role: Role.INSTRUCTOR,
      isEmailVerified: true,
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-04'),
      courseCount: 2,
      enrollmentCount: 28,
    },
    {
      id: 'inst_3',
      email: 'mike.wilson@example.com',
      firstName: 'Mike',
      lastName: 'Wilson',
      fullName: 'Mike Wilson',
      role: Role.INSTRUCTOR,
      isEmailVerified: true,
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-05'),
      courseCount: 1,
      enrollmentCount: 18,
    },
  ];

  private mockCourses: Course[] = [
    {
      id: 'course_1',
      title: 'JavaScript Fundamentals',
      description: 'Learn the basics of JavaScript programming language',
      thumbnail: 'https://example.com/js-thumb.jpg',
      price: 49.99,
      level: CourseLevel.BEGINNER,
      categoryId: 'cat_1',
      instructorId: 'inst_1',
      isPublished: true,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-20'),
      category: this.mockCategories[0],
      instructor: this.mockInstructors[0],
      _count: {
        enrollments: 45,
        lessons: 12,
        quizzes: 3,
      },
    },
    {
      id: 'course_2',
      title: 'React Development Mastery',
      description: 'Build modern web applications with React',
      thumbnail: 'https://example.com/react-thumb.jpg',
      price: 79.99,
      level: CourseLevel.INTERMEDIATE,
      categoryId: 'cat_1',
      instructorId: 'inst_1',
      isPublished: true,
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-25'),
      category: this.mockCategories[0],
      instructor: this.mockInstructors[0],
      _count: {
        enrollments: 32,
        lessons: 18,
        quizzes: 5,
      },
    },
    {
      id: 'course_3',
      title: 'UI/UX Design Principles',
      description:
        'Master the fundamentals of user interface and experience design',
      thumbnail: 'https://example.com/design-thumb.jpg',
      price: 59.99,
      level: CourseLevel.BEGINNER,
      categoryId: 'cat_2',
      instructorId: 'inst_2',
      isPublished: false,
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-01-22'),
      category: this.mockCategories[1],
      instructor: this.mockInstructors[1],
      _count: {
        enrollments: 0,
        lessons: 8,
        quizzes: 2,
      },
    },
    {
      id: 'course_4',
      title: 'Advanced TypeScript',
      description: 'Deep dive into TypeScript advanced features and patterns',
      thumbnail: 'https://example.com/ts-thumb.jpg',
      price: 89.99,
      level: CourseLevel.ADVANCED,
      categoryId: 'cat_1',
      instructorId: 'inst_3',
      isPublished: true,
      createdAt: new Date('2024-01-05'),
      updatedAt: new Date('2024-01-30'),
      category: this.mockCategories[0],
      instructor: this.mockInstructors[2],
      _count: {
        enrollments: 18,
        lessons: 25,
        quizzes: 8,
      },
    },
    {
      id: 'course_5',
      title: 'Digital Marketing Strategy',
      description:
        'Learn effective digital marketing techniques and strategies',
      thumbnail: 'https://example.com/marketing-thumb.jpg',
      price: 69.99,
      level: CourseLevel.INTERMEDIATE,
      categoryId: 'cat_4',
      instructorId: 'inst_2',
      isPublished: true,
      createdAt: new Date('2024-01-12'),
      updatedAt: new Date('2024-01-28'),
      category: this.mockCategories[3],
      instructor: this.mockInstructors[1],
      _count: {
        enrollments: 28,
        lessons: 15,
        quizzes: 4,
      },
    },
  ];

  constructor() {
    this.categoriesSubject.next(this.mockCategories);
    this.instructorsSubject.next(this.mockInstructors);
    this.coursesSubject.next(this.mockCourses);
  }

  getCourses(
    filters?: CourseFilters
  ): Observable<{ courses: Course[]; total: number }> {
    this.loadingSubject.next(true);

    return of(this.mockCourses).pipe(
      delay(500),
      map((courses) => {
        let filteredCourses = [...courses];

        // Apply filters
        if (filters?.search) {
          const search = filters.search.toLowerCase();
          filteredCourses = filteredCourses.filter(
            (course) =>
              course.title.toLowerCase().includes(search) ||
              course.description?.toLowerCase().includes(search) ||
              course.instructor?.firstName.toLowerCase().includes(search) ||
              course.instructor?.lastName.toLowerCase().includes(search)
          );
        }

        if (filters?.categoryId) {
          filteredCourses = filteredCourses.filter(
            (course) => course.categoryId === filters.categoryId
          );
        }

        if (filters?.level) {
          filteredCourses = filteredCourses.filter(
            (course) => course.level === filters.level
          );
        }

        if (filters?.isPublished !== undefined) {
          filteredCourses = filteredCourses.filter(
            (course) => course.isPublished === filters.isPublished
          );
        }

        if (filters?.instructorId) {
          filteredCourses = filteredCourses.filter(
            (course) => course.instructorId === filters.instructorId
          );
        }

        // Apply sorting
        if (filters?.sortBy) {
          filteredCourses.sort((a, b) => {
            let aValue: any;
            let bValue: any;

            switch (filters.sortBy) {
              case 'title':
                aValue = a.title;
                bValue = b.title;
                break;
              case 'createdAt':
                aValue = a.createdAt;
                bValue = b.createdAt;
                break;
              case 'updatedAt':
                aValue = a.updatedAt;
                bValue = b.updatedAt;
                break;
              case 'enrollments':
                aValue = a._count?.enrollments || 0;
                bValue = b._count?.enrollments || 0;
                break;
              default:
                return 0;
            }

            if (aValue < bValue) return filters.sortOrder === 'desc' ? 1 : -1;
            if (aValue > bValue) return filters.sortOrder === 'desc' ? -1 : 1;
            return 0;
          });
        }

        // Apply pagination
        const page = filters?.page || 1;
        const limit = filters?.limit || 10;
        const startIndex = (page - 1) * limit;
        const paginatedCourses = filteredCourses.slice(
          startIndex,
          startIndex + limit
        );

        return {
          courses: paginatedCourses,
          total: filteredCourses.length,
        };
      }),
      tap(() => this.loadingSubject.next(false))
    );
  }

  getCourse(id: string): Observable<Course> {
    this.loadingSubject.next(true);

    const course = this.mockCourses.find((c) => c.id === id);

    if (!course) {
      this.loadingSubject.next(false);
      return throwError(() => new Error('Course not found'));
    }

    return of(course).pipe(
      delay(300),
      tap(() => this.loadingSubject.next(false))
    );
  }

  createCourse(courseData: Partial<Course>): Observable<Course> {
    this.loadingSubject.next(true);

    const newCourse: Course = {
      id: `course_${Date.now()}`,
      title: courseData.title || '',
      description: courseData.description,
      thumbnail: courseData.thumbnail,
      price: courseData.price,
      level: courseData.level || CourseLevel.BEGINNER,
      categoryId: courseData.categoryId || '',
      instructorId: courseData.instructorId || '',
      isPublished: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      category: this.mockCategories.find((c) => c.id === courseData.categoryId),
      instructor: this.mockInstructors.find(
        (i) => i.id === courseData.instructorId
      ),
      _count: {
        enrollments: 0,
        lessons: 0,
        quizzes: 0,
      },
    };

    return of(newCourse).pipe(
      delay(800),
      tap((course) => {
        this.mockCourses.push(course);
        this.coursesSubject.next([...this.mockCourses]);
        this.loadingSubject.next(false);
      })
    );
  }

  updateCourse(id: string, courseData: Partial<Course>): Observable<Course> {
    this.loadingSubject.next(true);

    const courseIndex = this.mockCourses.findIndex((c) => c.id === id);

    if (courseIndex === -1) {
      this.loadingSubject.next(false);
      return throwError(() => new Error('Course not found'));
    }

    const updatedCourse = {
      ...this.mockCourses[courseIndex],
      ...courseData,
      updatedAt: new Date(),
      category: courseData.categoryId
        ? this.mockCategories.find((c) => c.id === courseData.categoryId)
        : this.mockCourses[courseIndex].category,
      instructor: courseData.instructorId
        ? this.mockInstructors.find((i) => i.id === courseData.instructorId)
        : this.mockCourses[courseIndex].instructor,
    };

    return of(updatedCourse).pipe(
      delay(600),
      tap((course) => {
        this.mockCourses[courseIndex] = course;
        this.coursesSubject.next([...this.mockCourses]);
        this.loadingSubject.next(false);
      })
    );
  }

  deleteCourse(id: string): Observable<void> {
    this.loadingSubject.next(true);

    const courseIndex = this.mockCourses.findIndex((c) => c.id === id);

    if (courseIndex === -1) {
      this.loadingSubject.next(false);
      return throwError(() => new Error('Course not found'));
    }

    return of(undefined).pipe(
      delay(400),
      tap(() => {
        this.mockCourses.splice(courseIndex, 1);
        this.coursesSubject.next([...this.mockCourses]);
        this.loadingSubject.next(false);
      })
    );
  }

  publishCourse(id: string): Observable<Course> {
    return this.updateCourse(id, { isPublished: true });
  }

  unpublishCourse(id: string): Observable<Course> {
    return this.updateCourse(id, { isPublished: false });
  }

  getCategories(): Observable<Category[]> {
    return this.categories$;
  }

  getInstructors(): Observable<User[]> {
    return this.instructors$;
  }

  getCourseStats(): Observable<CourseStats> {
    const courses = this.mockCourses;
    const publishedCourses = courses.filter((c) => c.isPublished);
    const totalEnrollments = courses.reduce(
      (sum, c) => sum + (c._count?.enrollments || 0),
      0
    );
    const totalRevenue = courses.reduce(
      (sum, c) => sum + (c.price || 0) * (c._count?.enrollments || 0),
      0
    );

    const stats: CourseStats = {
      totalCourses: courses.length,
      publishedCourses: publishedCourses.length,
      draftCourses: courses.length - publishedCourses.length,
      totalEnrollments,
      totalRevenue,
      avgRating: 4.2,
    };

    return of(stats).pipe(delay(200));
  }
}
