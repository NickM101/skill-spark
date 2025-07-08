// src/app/features/admin/modules/course-management/components/course-detail/course-detail.component.ts

import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { CourseService } from '../../services/admin-course.service';
import { Course, CourseLevel } from '@core/models/course.model';
import { SharedModule } from '@shared/shared.module';
import { LessonListComponent } from "../../../lessons/components/lesson-list/lesson-list.component";

@Component({
  selector: 'app-course-detail',
  templateUrl: './course-detail.component.html',
  styleUrls: ['./course-detail.component.scss'],
  imports: [SharedModule, LessonListComponent],

  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  course: Course | null = null;
  courseId: string | null = null;
  loading$ = this.adminCourseService.loading$;

  selectedTabIndex = 0;

  // Enums for template
  CourseLevel = CourseLevel;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private adminCourseService: CourseService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.courseId = this.route.snapshot.paramMap.get('id');
    if (this.courseId) {
      this.loadCourse(this.courseId);
    } else {
      this.router.navigate(['/admin/courses']);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCourse(id: string): void {
    this.adminCourseService
      .getCourse(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (course) => {
          this.course = course;
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.snackBar.open('Failed to load course', 'Close', {
            duration: 3000,
          });
          this.router.navigate(['/admin/courses']);
          this.cdr.detectChanges();
        },
      });
  }

  onEditCourse(): void {
    if (this.courseId) {
      this.router.navigate(['/admin/courses', this.courseId, 'edit']);
    }
  }

  onBackToCourses(): void {
    this.router.navigate(['/admin/courses']);
  }

  onPublishCourse(): void {
    if (!this.course) return;

    const action = this.course.isPublished ? 'unpublish' : 'publish';
    const serviceCall = this.course.isPublished
      ? this.adminCourseService.unpublishCourse(this.course.id)
      : this.adminCourseService.publishCourse(this.course.id);

    serviceCall.pipe(takeUntil(this.destroy$)).subscribe({
      next: (updatedCourse) => {
        this.course = updatedCourse;
        this.snackBar.open(`Course ${action}ed successfully`, 'Close', {
          duration: 3000,
        });
      },
      error: (error) => {
        this.snackBar.open(`Failed to ${action} course`, 'Close', {
          duration: 3000,
        });
      },
    });
  }

  onDeleteCourse(): void {
    if (!this.course) return;

    if (
      confirm(
        `Are you sure you want to delete "${this.course.title}"? This action cannot be undone.`
      )
    ) {
      this.adminCourseService
        .deleteCourse(this.course.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.snackBar.open('Course deleted successfully', 'Close', {
              duration: 3000,
            });
            this.router.navigate(['/admin/courses']);
          },
          error: (error) => {
            this.snackBar.open('Failed to delete course', 'Close', {
              duration: 3000,
            });
          },
        });
    }
  }

  onDuplicateCourse(): void {
    if (!this.course) return;

    // const duplicateData = {
    //   title: `${this.course.title} (Copy)`,
    //   description: this.course.description,
    //   thumbnail: this.course.thumbnail,
    //   price: this.course.price,
    //   level: this.course.level,
    //   categoryId: this.course.categoryId,
    //   instructorId: this.course.instructorId,
    //   isPublished: false, // Always create duplicates as drafts
    // };

    // this.adminCourseService
    //   .createCourse()
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe({
    //     next: (newCourse) => {
    //       this.snackBar.open('Course duplicated successfully', 'Close', {
    //         duration: 3000,
    //       });
    //       this.router.navigate(['/admin/courses', newCourse.id]);
    //     },
    //     error: (error) => {
    //       this.snackBar.open('Failed to duplicate course', 'Close', {
    //         duration: 3000,
    //       });
    //     },
    //   });
  }

  // Handle tab changes
  onTabChange(index: number): void {
    this.selectedTabIndex = index;
  }

  // Helper methods for template
  getStatusChipColor(isPublished: boolean): string {
    return isPublished ? 'primary' : 'warn';
  }

  canEditCourse(): boolean {
    return true;
  }

  getStatusText(isPublished: boolean): string {
    return isPublished ? 'Published' : 'Draft';
  }

  getLevelColor(level: CourseLevel): string {
    switch (level) {
      case CourseLevel.BEGINNER:
        return 'primary';
      case CourseLevel.INTERMEDIATE:
        return 'accent';
      case CourseLevel.ADVANCED:
        return 'warn';
      default:
        return 'primary';
    }
  }

  formatPrice(price?: number): string {
    return price ? `$${price.toFixed(2)}` : 'Free';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getPublishButtonText(): string {
    return this.course?.isPublished ? 'Unpublish Course' : 'Publish Course';
  }

  getPublishButtonIcon(): string {
    return this.course?.isPublished ? 'unpublished' : 'publish';
  }

  getEnrollmentRate(): number {
    // Mock calculation - in real app this would come from analytics
    const enrollments = this.course?._count?.enrollments || 0;
    const views = enrollments * 3; // Assume 3 views per enrollment
    return views > 0 ? Math.round((enrollments / views) * 100) : 0;
  }

  getCompletionRate(): number {
    // Mock calculation - in real app this would come from progress data
    return Math.floor(Math.random() * 40) + 60; // Random between 60-100%
  }

  getRevenue(): number {
    const price = this.course?.price || 0;
    const enrollments = this.course?._count?.enrollments || 0;
    return price * enrollments;
  }
}
