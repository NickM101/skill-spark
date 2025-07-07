// src/app/features/courses/components/lesson-player/lesson-player.component.ts

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
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CourseService } from '../../services/course.service';
import { Course } from '@core/models/course.model';
import { Lesson, LessonType } from '@core/models/lesson.model';
import { SharedModule } from '@shared/shared.module';

@Component({
  selector: 'app-lesson-player',
  templateUrl: './lesson-player.component.html',
  styleUrls: ['./lesson-player.component.scss'],
  imports: [SharedModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LessonPlayerComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  course: Course | null = null;
  currentLesson: Lesson | null = null;
  currentLessonIndex = 0;
  isUpdating = false;

  readonly LessonType = LessonType;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadLessonData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadLessonData(): void {
    this.route.params
      .pipe(
        switchMap((params) => {
          const courseId = params['courseId'];
          const lessonId = params['lessonId'];
          return this.courseService.getCourseById(courseId);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (course) => {
          if (course) {
            this.course = course;
            this.setCurrentLesson();
          } else {
            this.router.navigate(['/courses']);
          }
          this.cdr.markForCheck();
        },
        error: () => {
          this.router.navigate(['/courses']);
        },
      });
  }

  private setCurrentLesson(): void {
    const lessonId = this.route.snapshot.params['lessonId'];
    if (this.course?.lessons) {
      this.currentLessonIndex = this.course.lessons.findIndex(
        (l) => l.id === lessonId
      );
      this.currentLesson = this.course.lessons[this.currentLessonIndex] || null;
    }
  }

  goBackToCourse(): void {
    if (this.course) {
      this.router.navigate(['/courses', this.course.id]);
    }
  }

  toggleComplete(): void {
    if (!this.currentLesson) return;

    this.isUpdating = true;
    this.currentLesson.isCompleted = !this.currentLesson.isCompleted;

    // Simple localStorage update
    this.updateLessonProgress();

    setTimeout(() => {
      this.isUpdating = false;
      this.cdr.markForCheck();
    }, 500);
  }

  previousLesson(): void {
    if (this.currentLessonIndex > 0) {
      this.navigateToLesson(this.currentLessonIndex - 1);
    }
  }

  nextLesson(): void {
    if (
      this.course?.lessons &&
      this.currentLessonIndex < this.course.lessons.length - 1
    ) {
      this.navigateToLesson(this.currentLessonIndex + 1);
    }
  }

  private navigateToLesson(index: number): void {
    if (this.course?.lessons && this.course.lessons[index]) {
      const lesson = this.course.lessons[index];
      this.router.navigate(['/courses', this.course.id, 'lesson', lesson.id]);
    }
  }

  private updateLessonProgress(): void {
    const progressKey = `lesson_progress_${this.currentLesson?.id}`;
    const progress = {
      lessonId: this.currentLesson?.id,
      isCompleted: this.currentLesson?.isCompleted,
      completedAt: this.currentLesson?.isCompleted
        ? new Date().toISOString()
        : null,
    };
    localStorage.setItem(progressKey, JSON.stringify(progress));
  }

  // YouTube helper methods
  isYouTubeVideo(url?: string): boolean {
    if (!url) return false;
    return url.includes('youtube.com') || url.includes('youtu.be');
  }

  getYouTubeEmbedUrl(url?: string): SafeResourceUrl | null {
    if (!url) return null;

    let videoId = '';
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1]?.split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0];
    }

    if (videoId) {
      const embedUrl = `https://www.youtube.com/embed/${videoId}`;
      return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
    }

    return null;
  }

  getPdfViewerUrl(url?: string): SafeResourceUrl | null {
    if (!url) return null;
    const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(
      url
    )}&embedded=true`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(viewerUrl);
  }
}
