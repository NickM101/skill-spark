import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

import {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CategoryListResponse,
} from '@core/models/category.model';
import { Course, CourseLevel } from '@core/models/course.model';
import { User, Role } from '@core/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private categoriesSubject = new BehaviorSubject<Category[]>([]);
  public categories$ = this.categoriesSubject.asObservable();

  constructor() {
    const mockCategories = this.buildMockCategories();
    this.categoriesSubject.next(mockCategories);
  }

  // ----------------------
  // Public CRUD Methods
  // ----------------------

  getCategories(): Observable<CategoryListResponse> {
    const categories = this.categoriesSubject.value;

    return of({
      categories,
      total: categories.length,
      page: 1,
      limit: 10,
    }).pipe(delay(300));
  }

  getCategoryById(id: string): Observable<Category | null> {
    const category = this.categoriesSubject.value.find((c) => c.id === id);
    return of(category || null).pipe(delay(200));
  }

  createCategory(request: CreateCategoryRequest): Observable<Category> {
    const categories = this.categoriesSubject.value;

    if (
      categories.some(
        (c) =>
          request.name && c.name.toLowerCase() === request.name.toLowerCase()
      )
    ) {
      return throwError(
        () => new Error('Category with this name already exists')
      );
    }

    const newCategory: Category = {
      id: this.generateId(),
      name: request.name,
      description: request.description || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      courses: [],
    };

    this.categoriesSubject.next([...categories, newCategory]);

    return of(newCategory).pipe(delay(500));
  }

  updateCategory(request: UpdateCategoryRequest): Observable<Category> {
    const categories = this.categoriesSubject.value;
    const index = categories.findIndex((c) => c.id === request.id);

    if (index === -1) {
      return throwError(() => new Error('Category not found'));
    }

    if (
      request.name &&
      categories.some(
        (c) =>
          c.id !== request.id &&
          c.name.toLowerCase() === request.name?.toLowerCase()
      )
    ) {
      return throwError(
        () => new Error('Category with this name already exists')
      );
    }

    const updatedCategory: Category = {
      ...categories[index],
      name: request.name || categories[index].name,
      description: request.description ?? categories[index].description,
      updatedAt: new Date(),
    };

    const updatedCategories = [...categories];
    updatedCategories[index] = updatedCategory;

    this.categoriesSubject.next(updatedCategories);
    return of(updatedCategory).pipe(delay(500));
  }

  deleteCategory(id: string): Observable<void> {
    const categories = this.categoriesSubject.value;
    const category = categories.find((c) => c.id === id);

    if (!category) {
      return throwError(() => new Error('Category not found'));
    }

    if (category.courses && category.courses.length > 0) {
      return throwError(
        () => new Error('Cannot delete category with associated courses')
      );
    }

    const updatedCategories = categories.filter((c) => c.id !== id);
    this.categoriesSubject.next(updatedCategories);

    return of(void 0).pipe(delay(500));
  }

  // ----------------------
  // Mock Data Builders
  // ----------------------

  private buildMockCategories(): Category[] {
    const instructors = this.getMockInstructors();

    const programming: Category = {
      id: 'cat_1',
      name: 'Programming',
      description: 'Learn programming languages and frameworks',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
      courses: [
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
          instructor: instructors[0],
          _count: { enrollments: 45, lessons: 12, quizzes: 3 },
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
          instructor: instructors[0],
          _count: { enrollments: 32, lessons: 18, quizzes: 5 },
        },
        {
          id: 'course_4',
          title: 'Advanced TypeScript',
          description:
            'Deep dive into TypeScript advanced features and patterns',
          thumbnail: 'https://example.com/ts-thumb.jpg',
          price: 89.99,
          level: CourseLevel.ADVANCED,
          categoryId: 'cat_1',
          instructorId: 'inst_3',
          isPublished: true,
          createdAt: new Date('2024-01-05'),
          updatedAt: new Date('2024-01-30'),
          instructor: instructors[2],
          _count: { enrollments: 18, lessons: 25, quizzes: 8 },
        },
      ],
    };

    const design: Category = {
      id: 'cat_2',
      name: 'Design',
      description: 'Master design principles and tools',
      createdAt: new Date('2024-01-16'),
      updatedAt: new Date('2024-01-16'),
      courses: [
        {
          id: 'course_3',
          title: 'UI/UX Design Principles',
          description: 'Master the fundamentals of UI and UX design',
          thumbnail: 'https://example.com/design-thumb.jpg',
          price: 59.99,
          level: CourseLevel.BEGINNER,
          categoryId: 'cat_2',
          instructorId: 'inst_2',
          isPublished: false,
          createdAt: new Date('2024-01-20'),
          updatedAt: new Date('2024-01-22'),
          instructor: instructors[1],
          _count: { enrollments: 0, lessons: 8, quizzes: 2 },
        },
      ],
    };

    const business: Category = {
      id: 'cat_3',
      name: 'Business',
      description: 'Develop business and entrepreneurship skills',
      createdAt: new Date('2024-01-17'),
      updatedAt: new Date('2024-01-17'),
      courses: [],
    };

    const marketing: Category = {
      id: 'cat_4',
      name: 'Marketing',
      description: 'Learn digital marketing strategies',
      createdAt: new Date('2024-01-18'),
      updatedAt: new Date('2024-01-18'),
      courses: [
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
          instructor: instructors[1],
          _count: { enrollments: 28, lessons: 15, quizzes: 4 },
        },
      ],
    };

    return [programming, design, business, marketing];
  }

  private getMockInstructors(): User[] {
    return [
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
  }

  // ----------------------
  // Helpers
  // ----------------------

  private generateId(): string {
    return 'cat_' + Math.random().toString(36).substr(2, 9);
  }
}
