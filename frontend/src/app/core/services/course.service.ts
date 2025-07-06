// course.service.ts
import { Injectable } from '@angular/core';
import { Course, CourseLevel } from '../models/course.model';

@Injectable({
  providedIn: 'root',
})
export class CourseService {
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
    // Add more mock courses as needed
  ];

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
