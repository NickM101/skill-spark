// src/app/features/courses/components/course-card/course-card.component.ts

import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import {
  Course,
  CourseLevel,
  User,
} from '../../../../core/models/course.model';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSpinner } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-course-card',
  templateUrl: './course-card.html',
  styleUrls: ['./course-card.scss'],
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTabsModule,
    MatCardModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatDividerModule,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseCardComponent {
  @Input() course!: Course;
  @Input() isEnrolled = false;
  @Input() progress = 0;
  @Input() showProgress = false;
  @Input() compact = false;

  @Output() courseClick = new EventEmitter<Course>();
  @Output() enrollClick = new EventEmitter<Course>();
  @Output() continueClick = new EventEmitter<Course>();

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

  getInstructorName(): string {
    if (!this.course.instructor) return 'Unknown Instructor';
    return `${this.course.instructor.firstName} ${this.course.instructor.lastName}`;
  }

  getLevelBadgeClass(): string {
    switch (this.course.level) {
      case CourseLevel.BEGINNER:
        return 'badge-success';
      case CourseLevel.INTERMEDIATE:
        return 'badge-primary';
      case CourseLevel.ADVANCED:
        return 'badge-warn';
      default:
        return 'badge-secondary';
    }
  }

  formatPrice(): string {
    if (!this.course.price) return 'Free';
    return `$${this.course.price.toFixed(2)}`;
  }

  getLessonCount(): number {
    return this.course.lessons ? this.course.lessons.length : 0;
  }

  getCategoryName(): string {
    return this.course.category ? this.course.category.name : 'Unknown';
  }
}
