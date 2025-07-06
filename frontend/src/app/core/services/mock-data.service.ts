// src/app/core/services/mock-data.service.ts

import { Injectable } from '@angular/core';
import { Category } from '@core/models/category.model';
import { Course, CourseLevel } from '@core/models/course.model';
import { Lesson, LessonType } from '@core/models/lesson.model';
import { User, Role } from '@core/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class MockDataService {
  private users: User[] = [
    {
      id: 'user-1',
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: Role.INSTRUCTOR,
      isEmailVerified: true,
      isActive: true,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
    },
    {
      id: 'user-2',
      email: 'jane.smith@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      role: Role.INSTRUCTOR,
      isEmailVerified: true,
      isActive: true,
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-10'),
    },
    {
      id: 'user-3',
      email: 'alice.johnson@example.com',
      firstName: 'Alice',
      lastName: 'Johnson',
      role: Role.INSTRUCTOR,
      isEmailVerified: true,
      isActive: true,
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-01-20'),
    },
  ];

  private categories: Category[] = [
    {
      id: 'cat-1',
      name: 'Programming',
      description: 'Learn programming languages and frameworks',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'cat-2',
      name: 'Design',
      description: 'Master design principles and tools',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'cat-3',
      name: 'Business',
      description: 'Develop business and entrepreneurship skills',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'cat-4',
      name: 'Marketing',
      description: 'Learn digital marketing strategies',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ];

  private lessons: Lesson[] = [
    // JavaScript Fundamentals lessons
    {
      id: 'lesson-1',
      title: 'Introduction to JavaScript',
      content: 'Welcome to JavaScript programming',
      type: LessonType.VIDEO,
      videoUrl: 'https://example.com/video1',
      orderIndex: 1,
      courseId: 'course-1',
      isPublished: true,
      createdAt: new Date('2024-01-16'),
      updatedAt: new Date('2024-01-16'),
    },
    {
      id: 'lesson-2',
      title: 'Variables and Data Types',
      content: 'Learn about JavaScript variables',
      type: LessonType.TEXT,
      orderIndex: 2,
      courseId: 'course-1',
      isPublished: true,
      createdAt: new Date('2024-01-16'),
      updatedAt: new Date('2024-01-16'),
    },
    {
      id: 'lesson-3',
      title: 'Functions and Scope',
      content: 'Understanding JavaScript functions',
      type: LessonType.VIDEO,
      videoUrl: 'https://example.com/video2',
      orderIndex: 3,
      courseId: 'course-1',
      isPublished: true,
      createdAt: new Date('2024-01-16'),
      updatedAt: new Date('2024-01-16'),
    },

    // React Development lessons
    {
      id: 'lesson-4',
      title: 'React Basics',
      content: 'Getting started with React',
      type: LessonType.VIDEO,
      videoUrl: 'https://example.com/video3',
      orderIndex: 1,
      courseId: 'course-2',
      isPublished: true,
      createdAt: new Date('2024-01-17'),
      updatedAt: new Date('2024-01-17'),
    },
    {
      id: 'lesson-5',
      title: 'Components and Props',
      content: 'Understanding React components',
      type: LessonType.TEXT,
      orderIndex: 2,
      courseId: 'course-2',
      isPublished: true,
      createdAt: new Date('2024-01-17'),
      updatedAt: new Date('2024-01-17'),
    },

    // UI/UX Design lessons
    {
      id: 'lesson-6',
      title: 'Design Thinking Process',
      content: 'Introduction to design thinking',
      type: LessonType.VIDEO,
      videoUrl: 'https://example.com/video4',
      orderIndex: 1,
      courseId: 'course-3',
      isPublished: true,
      createdAt: new Date('2024-01-18'),
      updatedAt: new Date('2024-01-18'),
    },
    {
      id: 'lesson-7',
      title: 'Color Theory Basics',
      content: 'Understanding color in design',
      type: LessonType.PDF,
      fileUrl: 'https://example.com/color-theory.pdf',
      orderIndex: 2,
      courseId: 'course-3',
      isPublished: true,
      createdAt: new Date('2024-01-18'),
      updatedAt: new Date('2024-01-18'),
    },

    // Digital Marketing lessons
    {
      id: 'lesson-8',
      title: 'Marketing Fundamentals',
      content: 'Basic marketing concepts',
      type: LessonType.TEXT,
      orderIndex: 1,
      courseId: 'course-4',
      isPublished: true,
      createdAt: new Date('2024-01-19'),
      updatedAt: new Date('2024-01-19'),
    },
    {
      id: 'lesson-9',
      title: 'SEO Strategies',
      content: 'Search engine optimization techniques',
      type: LessonType.VIDEO,
      videoUrl: 'https://example.com/video5',
      orderIndex: 2,
      courseId: 'course-4',
      isPublished: true,
      createdAt: new Date('2024-01-19'),
      updatedAt: new Date('2024-01-19'),
    },

    // Angular Development lessons
    {
      id: 'lesson-10',
      title: 'Angular Architecture',
      content: 'Understanding Angular framework',
      type: LessonType.VIDEO,
      videoUrl: 'https://example.com/video6',
      orderIndex: 1,
      courseId: 'course-5',
      isPublished: true,
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-01-20'),
    },
    {
      id: 'lesson-11',
      title: 'Components and Services',
      content: 'Building Angular components',
      type: LessonType.TEXT,
      orderIndex: 2,
      courseId: 'course-5',
      isPublished: true,
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-01-20'),
    },

    // Python Basics lessons
    {
      id: 'lesson-12',
      title: 'Python Syntax',
      content: 'Learn Python programming basics',
      type: LessonType.TEXT,
      orderIndex: 1,
      courseId: 'course-6',
      isPublished: true,
      createdAt: new Date('2024-01-21'),
      updatedAt: new Date('2024-01-21'),
    },
    {
      id: 'lesson-13',
      title: 'Data Structures',
      content: 'Python lists, tuples, and dictionaries',
      type: LessonType.VIDEO,
      videoUrl: 'https://example.com/video7',
      orderIndex: 2,
      courseId: 'course-6',
      isPublished: true,
      createdAt: new Date('2024-01-21'),
      updatedAt: new Date('2024-01-21'),
    },
  ];

  private courses: Course[] = [
    {
      id: 'course-1',
      title: 'JavaScript Fundamentals',
      description:
        'Learn the basics of JavaScript programming language. Master variables, functions, objects, and modern ES6+ features.',
      thumbnail:
        'https://via.placeholder.com/300x200/FFB74D/FFFFFF?text=JavaScript',
      price: 49.99,
      level: CourseLevel.BEGINNER,
      categoryId: 'cat-1',
      instructorId: 'user-1',
      isPublished: true,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
    },
    {
      id: 'course-2',
      title: 'React Development',
      description:
        'Build modern web applications with React. Learn components, hooks, state management, and best practices.',
      thumbnail: 'https://via.placeholder.com/300x200/61DAFB/FFFFFF?text=React',
      price: 79.99,
      level: CourseLevel.INTERMEDIATE,
      categoryId: 'cat-1',
      instructorId: 'user-1',
      isPublished: true,
      createdAt: new Date('2024-01-16'),
      updatedAt: new Date('2024-01-16'),
    },
    {
      id: 'course-3',
      title: 'UI/UX Design Principles',
      description:
        'Master the fundamentals of user interface and user experience design. Create beautiful and functional designs.',
      thumbnail:
        'https://via.placeholder.com/300x200/FF6B6B/FFFFFF?text=UI%2FUX',
      price: 59.99,
      level: CourseLevel.BEGINNER,
      categoryId: 'cat-2',
      instructorId: 'user-2',
      isPublished: true,
      createdAt: new Date('2024-01-17'),
      updatedAt: new Date('2024-01-17'),
    },
    {
      id: 'course-4',
      title: 'Digital Marketing Strategy',
      description:
        'Learn effective digital marketing techniques. Master SEO, social media marketing, and analytics.',
      thumbnail:
        'https://via.placeholder.com/300x200/4ECDC4/FFFFFF?text=Marketing',
      price: 69.99,
      level: CourseLevel.INTERMEDIATE,
      categoryId: 'cat-4',
      instructorId: 'user-2',
      isPublished: true,
      createdAt: new Date('2024-01-18'),
      updatedAt: new Date('2024-01-18'),
    },
    {
      id: 'course-5',
      title: 'Angular Development',
      description:
        'Build enterprise-level applications with Angular. Learn TypeScript, RxJS, and Angular best practices.',
      thumbnail:
        'https://via.placeholder.com/300x200/DD0031/FFFFFF?text=Angular',
      price: 89.99,
      level: CourseLevel.ADVANCED,
      categoryId: 'cat-1',
      instructorId: 'user-3',
      isPublished: true,
      createdAt: new Date('2024-01-19'),
      updatedAt: new Date('2024-01-19'),
    },
    {
      id: 'course-6',
      title: 'Python Programming Basics',
      description:
        'Start your programming journey with Python. Learn syntax, data structures, and problem-solving.',
      thumbnail:
        'https://via.placeholder.com/300x200/3776AB/FFFFFF?text=Python',
      price: 39.99,
      level: CourseLevel.BEGINNER,
      categoryId: 'cat-1',
      instructorId: 'user-3',
      isPublished: true,
      createdAt: new Date('2024-01-20'),
      updatedAt: new Date('2024-01-20'),
    },
    {
      id: 'course-7',
      title: 'Business Strategy Fundamentals',
      description:
        'Learn strategic thinking and business planning. Develop skills for entrepreneurship and leadership.',
      thumbnail:
        'https://via.placeholder.com/300x200/FF9800/FFFFFF?text=Business',
      price: 54.99,
      level: CourseLevel.BEGINNER,
      categoryId: 'cat-3',
      instructorId: 'user-1',
      isPublished: true,
      createdAt: new Date('2024-01-21'),
      updatedAt: new Date('2024-01-21'),
    },
    {
      id: 'course-8',
      title: 'Advanced Graphic Design',
      description:
        'Master advanced design techniques. Learn typography, layout design, and visual communication.',
      thumbnail:
        'https://via.placeholder.com/300x200/9C27B0/FFFFFF?text=Design',
      price: 74.99,
      level: CourseLevel.ADVANCED,
      categoryId: 'cat-2',
      instructorId: 'user-2',
      isPublished: true,
      createdAt: new Date('2024-01-22'),
      updatedAt: new Date('2024-01-22'),
    },
  ];

  getUsers(): User[] {
    return this.users;
  }

  getCategories(): Category[] {
    return this.categories;
  }

  getCourses(): Course[] {
    return this.courses.map((course) => ({
      ...course,
      category: this.categories.find((cat) => cat.id === course.categoryId),
      instructor: this.users.find((user) => user.id === course.instructorId),
      lessons: this.lessons.filter((lesson) => lesson.courseId === course.id),
    }));
  }

  getCourseById(id: string): Course | undefined {
    const course = this.courses.find((c) => c.id === id);
    if (!course) return undefined;

    return {
      ...course,
      category: this.categories.find((cat) => cat.id === course.categoryId),
      instructor: this.users.find((user) => user.id === course.instructorId),
      lessons: this.lessons.filter((lesson) => lesson.courseId === course.id),
    };
  }

  getLessonsByCourseId(courseId: string): Lesson[] {
    return this.lessons.filter((lesson) => lesson.courseId === courseId);
  }

  getCoursesByCategory(categoryId: string): Course[] {
    return this.getCourses().filter(
      (course) => course.categoryId === categoryId
    );
  }

  getCoursesByLevel(level: CourseLevel): Course[] {
    return this.getCourses().filter((course) => course.level === level);
  }

  searchCourses(query: string): Course[] {
    const searchTerm = query.toLowerCase();
    return this.getCourses().filter(
      (course) =>
        course.title.toLowerCase().includes(searchTerm) ||
        course.description?.toLowerCase().includes(searchTerm) ||
        course.category?.name.toLowerCase().includes(searchTerm)
    );
  }
}
