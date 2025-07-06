// src/app/features/public/courses/components/course-card/course-card.component.ts

import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
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
    return `${price.toFixed(2)}`;
  }

  getLessonCount(): number {
    return this.course.lessons?.length || 0;
  }

  getInstructorName(): string {
    if (!this.course.instructor) return 'Unknown Instructor';
    return `${this.course.instructor.firstName} ${this.course.instructor.lastName}`;
  }
}
