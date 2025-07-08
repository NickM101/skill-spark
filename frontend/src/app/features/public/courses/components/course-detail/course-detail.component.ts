// src/app/features/public/courses/components/course-detail/course-detail.component.ts (Updated)

import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';

import { CourseService } from '../../services/course.service';
import { Course, CourseLevel } from '@core/models/course.model';
import { LessonType, Lesson } from '@core/models/lesson.model';
import { SharedModule } from '@shared/shared.module';

@Component({
  selector: 'app-course-detail',
  templateUrl: './course-detail.component.html',
  styleUrls: ['./course-detail.component.scss'],
  imports: [SharedModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  course: Course | null = null;
  isLoading = true;
  isEnrolled = false; // This would come from enrollment service
  progress = 0; // This would come from progress service

  // Tab selection
  selectedTabIndex = 0;

  readonly CourseLevelEnum = CourseLevel;
  readonly LessonTypeEnum = LessonType;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCourse();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCourse(): void {
    this.route.params
      .pipe(
        switchMap((params) => {
          const courseId = params['id'];
          return this.courseService.getCourseById(courseId);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (course) => {
          if (course) {
            this.course = course;
            this.checkEnrollmentStatus();
          } else {
            this.router.navigate(['/courses']);
          }
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading course:', error);
          this.isLoading = false;
          this.router.navigate(['/courses']);
          this.cdr.markForCheck();
        },
      });
  }

  private checkEnrollmentStatus(): void {
    // This would typically check with an enrollment service
    // For now, we'll simulate enrollment status
    this.isEnrolled = false;
    this.progress = 0;
  }

  onEnrollClick(): void {
    if (!this.course) return;

    // Handle enrollment logic
    console.log('Enrolling in course:', this.course.title);

    // Simulate enrollment success
    this.isEnrolled = true;
    this.cdr.markForCheck();

    // In a real app, this would call an enrollment service
    // and navigate to the first lesson or show a confirmation
  }

  // NEW METHOD: Start learning from first lesson
  onStartLearning(): void {
    if (
      !this.course ||
      !this.course.lessons ||
      this.course.lessons.length === 0
    ) {
      console.error('No lessons available in this course');
      return;
    }

    const firstLesson = this.course.lessons[0];
    this.router.navigate([
      '/courses',
      this.course.id,
      'lesson',
      firstLesson.id,
    ]);
  }

  // NEW METHOD: Continue learning from last accessed or next incomplete lesson
  onContinueLearning(): void {
    if (!this.course || !this.course.lessons) return;

    // Find the first incomplete lesson or fallback to first lesson
    const nextLesson = this.findNextLesson() || this.course.lessons[0];
    this.router.navigate(['/courses', this.course.id, 'lesson', nextLesson.id]);
  }

  // NEW METHOD: Start specific lesson
  onStartLessonClick(lesson: Lesson): void {
    if (!this.isEnrolled) {
      this.onEnrollClick();
      return;
    }

    if (!this.course) return;
    this.router.navigate(['/courses', this.course.id, 'lesson', lesson.id]);
  }

  // NEW METHOD: Find next lesson to continue with
  private findNextLesson(): Lesson | null {
    if (!this.course?.lessons) return null;

    // Check localStorage for lesson progress
    for (const lesson of this.course.lessons) {
      const progressKey = `lesson_progress_${lesson.id}`;
      const progress = localStorage.getItem(progressKey);

      if (!progress) {
        // No progress found, this is the next lesson
        return lesson;
      }

      const progressData = JSON.parse(progress);
      if (!progressData.isCompleted) {
        // Found incomplete lesson
        return lesson;
      }
    }

    // All lessons completed, return last lesson
    return this.course.lessons[this.course.lessons.length - 1];
  }

  // NEW METHOD: Get lesson progress from localStorage
  getLessonProgress(lesson: Lesson): {
    isCompleted: boolean;
    completedAt?: string;
  } {
    const progressKey = `lesson_progress_${lesson.id}`;
    const progress = localStorage.getItem(progressKey);

    if (progress) {
      return JSON.parse(progress);
    }

    return { isCompleted: false };
  }

  // NEW METHOD: Check if lesson is completed
  isLessonCompleted(lesson: Lesson): boolean {
    return this.getLessonProgress(lesson).isCompleted;
  }

  // NEW METHOD: Get overall course progress
  getCourseProgress(): number {
    if (!this.course?.lessons || this.course.lessons.length === 0) return 0;

    const completedLessons = this.course.lessons.filter((lesson) =>
      this.isLessonCompleted(lesson)
    ).length;

    return Math.round((completedLessons / this.course.lessons.length) * 100);
  }

  onBackToCourses(): void {
    this.router.navigate(['/courses']);
  }

  // Existing methods remain the same...
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

  getLessonIcon(type: LessonType): string {
    switch (type) {
      case LessonType.VIDEO:
        return 'play_circle';
      case LessonType.TEXT:
        return 'article';
      case LessonType.PDF:
        return 'picture_as_pdf';
      default:
        return 'help';
    }
  }

  formatPrice(price?: number): string {
    if (price === undefined || price === 0) {
      return 'Free';
    }
    return `$${price.toFixed(2)}`;
  }

  getInstructorName(): string {
    if (!this.course?.instructor) return 'Unknown Instructor';
    return `${this.course.instructor.firstName} ${this.course.instructor.lastName}`;
  }

  getLessonCount(): number {
    return this.course?.lessons?.length || 0;
  }

  getEstimatedDuration(): string {
    const lessonCount = this.getLessonCount();
    const estimatedMinutes = lessonCount * 15; // Estimate 15 minutes per lesson

    if (estimatedMinutes < 60) {
      return `${estimatedMinutes} minutes`;
    }

    const hours = Math.floor(estimatedMinutes / 60);
    const minutes = estimatedMinutes % 60;

    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours} hours`;
  }

  getCategoryIcon(): string {
    if (!this.course?.category) return 'book';

    switch (this.course.category.name.toLowerCase()) {
      case 'programming':
        return 'code';
      case 'design':
        return 'palette';
      case 'business':
        return 'business';
      case 'marketing':
        return 'trending_up';
      default:
        return 'book';
    }
  }

  onTabChange(index: number): void {
    this.selectedTabIndex = index;
  }

  shareOnSocial(platform: string): void {
    if (!this.course) return;

    const url = window.location.href;
    const text = `Check out this course: ${this.course.title}`;

    let shareUrl = '';

    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          text
        )}&url=${encodeURIComponent(url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          url
        )}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
          url
        )}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  }

  copyLink(): void {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => {
        console.log('Link copied to clipboard');
        // You could show a toast notification here
      })
      .catch((err) => {
        console.error('Failed to copy link:', err);
      });
  }
}
