// admin.service.ts
import { inject, Injectable } from '@angular/core';
import { User, Role } from '../models/user.model';
import { Course, CourseLevel } from '../models/course.model';
import { ApiResponse, ApiService } from './api.service';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private authService = inject(AuthService);
  private apiService = inject(ApiService);

  private users: User[] = [];


  // private users: User[] = [
  //   {
  //     id: '1',
  //     email: 'admin@example.com',
  //     password: 'admin123',
  //     firstName: 'Admin',
  //     lastName: 'User',
  //     role: Role.ADMIN,
  //     isEmailVerified: true,
  //     isActive: true,
  //     createdAt: new Date(),
  //     updatedAt: new Date(),
  //   },
  //   {
  //     id: '2',
  //     email: 'instructor@example.com',
  //     password: 'instructor123',
  //     firstName: 'Instructor',
  //     lastName: 'User',
  //     role: Role.INSTRUCTOR,
  //     isEmailVerified: true,
  //     isActive: true,
  //     createdAt: new Date(),
  //     updatedAt: new Date(),
  //   },
  //   {
  //     id: '3',
  //     email: 'student@example.com',
  //     password: 'student123',
  //     firstName: 'Student',
  //     lastName: 'User',
  //     role: Role.STUDENT,
  //     isEmailVerified: true,
  //     isActive: true,
  //     createdAt: new Date(),
  //     updatedAt: new Date(),
  //   },
  // ];

  private courses: Course[] = [
    {
      id: '1',
      title: 'Introduction to Angular',
      description: 'Learn the basics of Angular and build your first app.',
      thumbnail: 'angular-thumbnail.jpg',
      price: 99.99,
      level: CourseLevel.BEGINNER,
      categoryId: '1',
      instructorId: '2',
      isPublished: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      title: 'Advanced Angular Concepts',
      description:
        'Dive deeper into Angular with advanced topics and best practices.',
      thumbnail: 'advanced-angular-thumbnail.jpg',
      price: 149.99,
      level: CourseLevel.ADVANCED,
      categoryId: '1',
      instructorId: '2',
      isPublished: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  // User Management
  getAllUsers(
    page: number = 1,
    limit: number = 10
  ): Observable<ApiResponse<User[]>> {
    return this.apiService.get<User[]>('/users', { page, limit });
  }

  getUserById(id: string): User | undefined {
    return this.users.find((user) => user.id === id);
  }

  createUser(user: User): void {
    this.users.push(user);
  }

  updateUser(id: string, user: User): void {
    const index = this.users.findIndex((u) => u.id === id);
    if (index !== -1) {
      this.users[index] = user;
    }
  }

  deleteUser(id: string): void {
    this.users = this.users.filter((user) => user.id !== id);
  }

  // Course Management
  getCourses(): Course[] {
    return this.courses;
  }

  getCourseById(id: string): Course | undefined {
    return this.courses.find((course) => course.id === id);
  }

  createCourse(course: Course): void {
    this.courses.push(course);
  }

  updateCourse(id: string, course: Course): void {
    const index = this.courses.findIndex((c) => c.id === id);
    if (index !== -1) {
      this.courses[index] = course;
    }
  }

  deleteCourse(id: string): void {
    this.courses = this.courses.filter((course) => course.id !== id);
  }
}
