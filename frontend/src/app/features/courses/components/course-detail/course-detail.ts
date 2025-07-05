// src/app/features/courses/components/course-detail/course-detail.component.ts

import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Observable, Subject, combineLatest, of } from 'rxjs';
import { takeUntil, switchMap, map, catchError } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { CourseService } from '../../services/course.service';
import { EnrollmentService } from '../../../../core/services/enrollment.service';
import {
  Course,
  Lesson,
  CourseLevel,
  LessonType,
  User,
  Enrollment,
} from '../../../../core/models/course.model';
import { AuthService } from '@core/services/auth.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenu, MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSpinner } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';

interface CourseDetailViewModel {
  course: Course;
  isEnrolled: boolean;
  enrollment?: Enrollment;
  currentUser?: User;
  canEnroll: boolean;
  progress: number;
}

@Component({
  selector: 'app-course-detail',
  templateUrl: './course-detail.html',
  styleUrls: ['./course-detail.scss'],
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
    MatSpinner,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  @ViewChild('shareMenu') shareMenu!: MatMenu;
  viewModel$!: Observable<CourseDetailViewModel | null>;
  loading$: Observable<boolean>;

  // Enums for template
  CourseLevel = CourseLevel;
  LessonType = LessonType;

  // UI State
  selectedTab = 0;
  showAllLessons = false;
  expandedDescription = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService,
    private authService: AuthService,
    private enrollmentService: EnrollmentService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.loading$ = this.courseService.loading$;
  }

  ngOnInit(): void {
    this.initializeViewModel();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeViewModel(): void {
    this.viewModel$ = this.route.paramMap.pipe(
      switchMap((params) => {
        const courseId = params.get('id');
        if (!courseId) {
          this.router.navigate(['/courses']);
          return of(null);
        }

        return combineLatest([
          this.courseService.getCourseById(courseId),
          this.authService.currentUser$,
          this.enrollmentService.getUserEnrollments(),
        ]).pipe(
          map(([course, user, enrollments]) => {
            if (!course) {
              throw new Error('Course not found');
            }

            const enrollment = enrollments.find(
              (e) => e.courseId === course.id
            );
            const isEnrolled = !!enrollment;
            const canEnroll = !!user && !isEnrolled;
            const progress = enrollment ? enrollment.progressPercent : 0;

            return {
              course,
              isEnrolled,
              enrollment,
              currentUser: user ?? undefined,
              canEnroll,
              progress,
            };
          }),
          catchError((error) => {
            console.error('Error loading course:', error);
            this.snackBar.open('Error loading course details', 'Close', {
              duration: 3000,
            });
            this.router.navigate(['/courses']);
            return of(null);
          })
        );
      }),
      takeUntil(this.destroy$)
    );
  }

  onEnrollClick(course: Course): void {
    if (!course) return;

    this.enrollmentService
      .enrollInCourse(course.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (enrollment) => {
          this.snackBar.open('Successfully enrolled in course!', 'Close', {
            duration: 3000,
          });
          // Refresh the view model to show updated enrollment status
          this.initializeViewModel();
        },
        error: (error) => {
          console.error('Enrollment error:', error);
          this.snackBar.open('Failed to enroll in course', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  onStartLearning(course: Course): void {
    if (!course.lessons || course.lessons.length === 0) {
      this.snackBar.open('No lessons available yet', 'Close', {
        duration: 3000,
      });
      return;
    }

    // Navigate to first lesson
    const firstLesson = course.lessons[0];
    this.router.navigate(['/courses', course.id, 'lessons', firstLesson.id]);
  }

  onLessonClick(course: Course, lesson: Lesson, isEnrolled: boolean): void {
    if (!isEnrolled) {
      this.snackBar.open(
        'Please enroll in the course to access lessons',
        'Close',
        {
          duration: 3000,
        }
      );
      return;
    }

    this.router.navigate(['/courses', course.id, 'lessons', lesson.id]);
  }

  onInstructorClick(instructor: User): void {
    // Navigate to instructor profile or courses
    this.router.navigate(['/instructors', instructor.id]);
  }

  onCategoryClick(categoryId: string): void {
    this.router.navigate(['/courses'], {
      queryParams: { category: categoryId },
    });
  }

  onTabChange(index: number): void {
    this.selectedTab = index;
  }

  toggleDescription(): void {
    this.expandedDescription = !this.expandedDescription;
  }

  toggleLessonsView(): void {
    this.showAllLessons = !this.showAllLessons;
  }

  shareOnSocial(platform: string, course: Course): void {
    const courseUrl = window.location.href;
    const text = `Check out this course: ${course.title}`;

    let shareUrl = '';

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          text
        )}&url=${encodeURIComponent(courseUrl)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          courseUrl
        )}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
          courseUrl
        )}`;
        break;
      default:
        // Copy to clipboard
        navigator.clipboard.writeText(courseUrl).then(() => {
          this.snackBar.open('Course link copied to clipboard!', 'Close', {
            duration: 2000,
          });
        });
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  }

  // Helper methods for template
  getInstructorName(instructor?: User): string {
    if (!instructor) return 'Unknown Instructor';
    return `${instructor.firstName} ${instructor.lastName}`;
  }

  getLevelBadgeClass(level: CourseLevel): string {
    switch (level) {
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

  getLessonTypeIcon(type: LessonType): string {
    switch (type) {
      case LessonType.VIDEO:
        return 'play_circle_outline';
      case LessonType.TEXT:
        return 'article';
      case LessonType.PDF:
        return 'picture_as_pdf';
      default:
        return 'help_outline';
    }
  }

  formatPrice(price?: number): string {
    if (!price) return 'Free';
    return `${price.toFixed(2)}`;
  }

  formatDuration(lessons?: Lesson[]): string {
    if (!lessons || lessons.length === 0) return '0 hours';
    // Mock calculation - in real app, lessons would have duration
    const estimatedHours = lessons.length * 0.5; // 30 minutes per lesson
    return `${estimatedHours} hours`;
  }

  getEstimatedDuration(lessonCount: number): string {
    const hours = Math.floor(lessonCount * 0.5);
    const minutes = (lessonCount * 0.5 - hours) * 60;

    if (hours === 0) {
      return `${Math.round(minutes)} min`;
    }

    return minutes > 0 ? `${hours}h ${Math.round(minutes)}m` : `${hours}h`;
  }

  getVisibleLessons(lessons?: Lesson[]): Lesson[] {
    if (!lessons) return [];
    return this.showAllLessons ? lessons : lessons.slice(0, 5);
  }

  getCompletedLessonsCount(lessons?: Lesson[]): number {
    if (!lessons) return 0;
    // This would come from progress data in a real app
    return Math.floor(lessons.length * 0.3); // Mock 30% completion
  }

  isLessonCompleted(lesson: Lesson): boolean {
    // This would check against actual progress data
    return Math.random() > 0.7; // Mock completion status
  }

  isLessonLocked(lesson: Lesson, index: number, isEnrolled: boolean): boolean {
    if (!isEnrolled) return true;

    // Simple sequential unlock logic
    // In a real app, this would be based on actual progress
    return index > 2; // First 3 lessons unlocked
  }

  trackByLessonId(index: number, lesson: Lesson): string {
    return lesson.id;
  }
}
