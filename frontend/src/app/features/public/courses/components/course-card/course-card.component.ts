// src/app/features/public/courses/components/course-card/course-card.component.ts (Small Update)

import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Router } from '@angular/router';
import { Course, CourseLevel } from '@core/models/course.model';
import { SharedModule } from '@shared/shared.module';

@Component({
  selector: 'app-course-card',
  templateUrl: './course-card.component.html',
  styleUrls: ['./course-card.component.scss'],
  imports: [SharedModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseCardComponent {
  @Input() course!: Course;
  @Input() showProgress = false;
  @Input() progress = 0;
  @Input() isEnrolled = false;
  @Input() compact = false;

  @Output() courseClick = new EventEmitter<Course>();
  @Output() enrollClick = new EventEmitter<Course>();
  @Output() continueClick = new EventEmitter<Course>();

  readonly CourseLevelEnum = CourseLevel;

  constructor(private router: Router) {}

  onCourseClick(): void {
    this.courseClick.emit(this.course);
  }

  onEnrollClick(event: Event): void {
    event.stopPropagation();
    this.enrollClick.emit(this.course);
  }

  onContinueClick(event: Event): void {
    event.stopPropagation();
    this.continueClick.emit(this.course);
  }

  // NEW METHOD: Quick start learning
  onQuickStartClick(event: Event): void {
    event.stopPropagation();

    if (!this.course.lessons || this.course.lessons.length === 0) {
      console.error('No lessons available');
      return;
    }

    // Navigate directly to first lesson
    const firstLesson = this.course.lessons[0];
    this.router.navigate([
      '/courses',
      this.course.id,
      'lesson',
      firstLesson.id,
    ]);
  }

  // NEW METHOD: Get course progress from localStorage
  getCourseProgress(): number {
    if (!this.course.lessons || this.course.lessons.length === 0) return 0;

    const completedLessons = this.course.lessons.filter((lesson) => {
      const progressKey = `lesson_progress_${lesson.id}`;
      const progress = localStorage.getItem(progressKey);

      if (progress) {
        const progressData = JSON.parse(progress);
        return progressData.isCompleted;
      }

      return false;
    }).length;

    return Math.round((completedLessons / this.course.lessons.length) * 100);
  }

  getLevelIcon(level: CourseLevel): string {
    switch (level) {
      case CourseLevel.BEGINNER:
        return 'trending_up';
      case CourseLevel.INTERMEDIATE:
        return 'show_chart';
      case CourseLevel.ADVANCED:
        return 'timeline';
      default:
        return 'help';
    }
  }

  getLevelColor(level: CourseLevel): string {
    switch (level) {
      case CourseLevel.BEGINNER:
        return 'success';
      case CourseLevel.INTERMEDIATE:
        return 'accent';
      case CourseLevel.ADVANCED:
        return 'warn';
      default:
        return 'primary';
    }
  }

  formatPrice(price?: number): string {
    if (price === undefined || price === 0) {
      return 'Free';
    }
    return `$${price.toFixed(2)}`;
  }

  getLessonCount(): number {
    return this.course.lessons?.length || 0;
  }

  getInstructorName(): string {
    if (!this.course.instructor) return 'Unknown Instructor';
    return `${this.course.instructor.firstName} ${this.course.instructor.lastName}`;
  }
}
