// src/app/features/lessons/components/lesson-list/lesson-list.component.ts

import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { Subject, BehaviorSubject } from 'rxjs';
import {
  takeUntil,
  debounceTime,
  startWith,
  distinctUntilChanged,
} from 'rxjs/operators';

import { LessonService } from '../../services/lesson.service';
import { Lesson, LessonType } from '@core/models/lesson.model';
import { SharedModule } from '@shared/shared.module';
import { LessonFormComponent } from '../lesson-form/lesson-form.component';
import { ConfirmDialogComponent } from '@features/admin/modules/category-management/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-lesson-list',
  templateUrl: './lesson-list.component.html',
  styleUrls: ['./lesson-list.component.scss'],
  imports: [SharedModule, DragDropModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LessonListComponent implements OnInit, OnDestroy {
  @Input() courseId!: string;
  @Input() readonly = false;
  @Output() lessonsChanged = new EventEmitter<number>();

  private destroy$ = new Subject<void>();
  private allLessonsSubject = new BehaviorSubject<Lesson[]>([]);

  lessons: Lesson[] = [];
  loading$ = new BehaviorSubject<boolean>(false);

  // Filters
  searchControl = new FormControl('');
  statusFilter = new FormControl('all');
  typeFilter = new FormControl('all');

  // Lesson types for template
  LessonType = LessonType;
  isReordering = false;

  // View options
  viewMode: 'list' | 'grid' = 'list';
  showReorderMode = false;

  constructor(
    private lessonService: LessonService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.courseId) {
      console.error('Course ID is required for lesson list');
      return;
    }

    this.setupFilters();
    this.loadLessons();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.allLessonsSubject.complete();
    this.loading$.complete();
  }

  private setupFilters(): void {
    // Search filter
    this.searchControl.valueChanges
      .pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.applyFilters());

    // Status filter
    this.statusFilter.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.applyFilters());

    // Type filter
    this.typeFilter.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.applyFilters());
  }

  private loadLessons(): void {
    if (!this.courseId) return;

    this.loading$.next(true);

    this.lessonService
      .getLessons(this.courseId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Handle both array and object responses
          const lessons = Array.isArray(response)
            ? response
            : response.lessons || [];
          this.allLessonsSubject.next(lessons);
          this.applyFilters();
          this.lessonsChanged.emit(lessons.length);
          this.loading$.next(false);
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading lessons:', error);
          this.showErrorMessage('Failed to load lessons');
          this.loading$.next(false);
          this.cdr.markForCheck();
        },
      });
  }

  private applyFilters(): void {
    let filteredLessons = [...this.allLessonsSubject.value];

    // Search filter
    const searchTerm = this.searchControl.value?.toLowerCase() || '';
    if (searchTerm) {
      filteredLessons = filteredLessons.filter(
        (lesson) =>
          lesson.title.toLowerCase().includes(searchTerm) ||
          lesson.content?.toLowerCase().includes(searchTerm)
      );
    }

    // Status filter
    const statusFilter = this.statusFilter.value;
    if (statusFilter === 'published') {
      filteredLessons = filteredLessons.filter((lesson) => lesson.isPublished);
    } else if (statusFilter === 'draft') {
      filteredLessons = filteredLessons.filter((lesson) => !lesson.isPublished);
    }

    // Type filter
    const typeFilter = this.typeFilter.value;
    if (typeFilter !== 'all') {
      filteredLessons = filteredLessons.filter(
        (lesson) => lesson.type === typeFilter
      );
    }

    // Sort by order index
    filteredLessons.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));

    this.lessons = filteredLessons;
    this.cdr.markForCheck();
  }

  // Lesson CRUD operations
  onCreateLesson(): void {
    if (!this.courseId) {
      this.showErrorMessage('Course ID is required to create lessons');
      return;
    }

    // Calculate next order index
    const allLessons = this.allLessonsSubject.value;
    const maxOrder =
      allLessons.length > 0
        ? Math.max(...allLessons.map((l) => l.orderIndex || 0))
        : 0;

    const dialogRef = this.dialog.open(LessonFormComponent, {
      width: '800px',
      maxWidth: '90vw',
      data: {
        mode: 'create',
        courseId: this.courseId,
        orderIndex: maxOrder + 1,
      },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.showSuccessMessage('Lesson created successfully');
        this.loadLessons(); // Reload to get fresh data
      }
    });
  }

  onEditLesson(lesson: Lesson): void {
    if (!lesson || !this.courseId) {
      this.showErrorMessage('Invalid lesson or course data');
      return;
    }

    const dialogRef = this.dialog.open(LessonFormComponent, {
      width: '800px',
      maxWidth: '90vw',
      data: {
        mode: 'edit',
        courseId: this.courseId,
        lesson: { ...lesson }, // Create a copy to avoid mutations
      },
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.showSuccessMessage('Lesson updated successfully');
        this.loadLessons(); // Reload to get fresh data
      }
    });
  }

  onDeleteLesson(lesson: Lesson): void {
    if (!lesson) {
      this.showErrorMessage('Invalid lesson data');
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Lesson',
        message: `Are you sure you want to delete "${lesson.title}"? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        confirmColor: 'warn',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.performDelete(lesson);
      }
    });
  }

  private performDelete(lesson: Lesson): void {
    if (!this.courseId || !lesson.id) {
      this.showErrorMessage('Invalid course or lesson ID');
      return;
    }

    this.loading$.next(true);

    this.lessonService
      .deleteLesson(this.courseId, lesson.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSuccessMessage('Lesson deleted successfully');
          this.loadLessons();
        },
        error: (error) => {
          console.error('Error deleting lesson:', error);
          this.showErrorMessage(
            `Failed to delete lesson: ${error.message || 'Unknown error'}`
          );
          this.loading$.next(false);
        },
      });
  }

  onTogglePublish(lesson: Lesson): void {
    if (!lesson || !this.courseId) {
      this.showErrorMessage('Invalid lesson or course data');
      return;
    }

    const action = lesson.isPublished ? 'unpublish' : 'publish';

    // Check if service has these methods, otherwise use generic update
    let serviceCall;
    if (
      this.lessonService.publishLesson &&
      this.lessonService.unpublishLesson
    ) {
      serviceCall = lesson.isPublished
        ? this.lessonService.unpublishLesson(this.courseId, lesson.id)
        : this.lessonService.publishLesson(this.courseId, lesson.id);
    } else {
      // Fallback to update method
      const updatedLesson = { ...lesson, isPublished: !lesson.isPublished };
      serviceCall = this.lessonService.updateLesson(
        this.courseId,
        lesson.id,
        updatedLesson
      );
    }

    this.loading$.next(true);

    serviceCall.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.showSuccessMessage(`Lesson ${action}ed successfully`);
        this.loadLessons();
      },
      error: (error) => {
        console.error(`Error ${action}ing lesson:`, error);
        this.showErrorMessage(`Failed to ${action} lesson`);
        this.loading$.next(false);
      },
    });
  }

  // Drag and drop reordering
  onDrop(event: CdkDragDrop<Lesson[]>) {
    if (event.previousIndex === event.currentIndex || this.isReordering) return;

    this.isReordering = true;

    const lessons = [...this.lessons];
    moveItemInArray(lessons, event.previousIndex, event.currentIndex);

    // Update order indices
    const reorderedLessons = lessons.map((lesson, index) => ({
      ...lesson,
      orderIndex: index + 1,
    }));

    // Check if service has reorder method
    if (this.lessonService.reorderLessons) {
      const lessonIds = reorderedLessons.map((l) => l.id);

      this.lessonService
        .reorderLessons(this.courseId, lessonIds)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.showSuccessMessage('Lessons reordered successfully');
            this.loadLessons();
            this.isReordering = false;
          },
          error: (err) => {
            console.error('Error reordering lessons:', err);
            this.showErrorMessage('Failed to reorder lessons');
            this.loadLessons();
            this.isReordering = false;
          },
        });
    } else {
      // Fallback: update each lesson individually
      this.updateLessonsOrder(reorderedLessons);
    }
  }

  private updateLessonsOrder(lessons: Lesson[]): void {
    // Update lessons order using individual updates
    const updatePromises = lessons.map((lesson, index) =>
      this.lessonService
        .updateLesson(this.courseId, lesson.id, {
          ...lesson,
          orderIndex: index + 1,
        })
        .toPromise()
    );

    Promise.all(updatePromises)
      .then(() => {
        this.showSuccessMessage('Lessons reordered successfully');
        this.loadLessons();
        this.isReordering = false;
      })
      .catch((error) => {
        console.error('Error reordering lessons:', error);
        this.showErrorMessage('Failed to reorder lessons');
        this.loadLessons();
        this.isReordering = false;
      });
  }

  // View controls
  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'list' ? 'grid' : 'list';
    this.cdr.markForCheck();
  }

  toggleReorderMode(): void {
    this.showReorderMode = !this.showReorderMode;
    if (!this.showReorderMode) {
      // Reset filters when exiting reorder mode
      this.clearFilters();
    }
    this.cdr.markForCheck();
  }

  clearFilters(): void {
    this.searchControl.setValue('');
    this.statusFilter.setValue('all');
    this.typeFilter.setValue('all');
  }

  refreshLessons(): void {
    this.loadLessons();
  }

  // Template helper methods
  getLessonIcon(type: LessonType): string {
    switch (type) {
      case LessonType.VIDEO:
        return 'play_circle_filled';
      case LessonType.PDF:
        return 'picture_as_pdf';
      case LessonType.TEXT:
        return 'article';
      default:
        return 'description';
    }
  }

  getLessonTypeLabel(type: LessonType): string {
    switch (type) {
      case LessonType.VIDEO:
        return 'Video';
      case LessonType.PDF:
        return 'PDF Document';
      case LessonType.TEXT:
        return 'Text Content';
      default:
        return type;
    }
  }

  getStatusChipColor(isPublished: boolean): string {
    return isPublished ? 'primary' : 'warn';
  }

  getStatusText(isPublished: boolean): string {
    return isPublished ? 'Published' : 'Draft';
  }

  formatDate(date: Date | string): string {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  }

  hasFiltersApplied(): boolean {
    return !!(
      this.searchControl.value ||
      this.statusFilter.value !== 'all' ||
      this.typeFilter.value !== 'all'
    );
  }

  getFilteredCount(): number {
    return this.lessons.length;
  }

  getTotalCount(): number {
    return this.allLessonsSubject.value.length;
  }

  canReorder(): boolean {
    return (
      !this.readonly && !this.hasFiltersApplied() && this.lessons.length > 1
    );
  }

  // TrackBy functions
  trackByLesson(index: number, lesson: Lesson): string {
    return lesson.id || index.toString();
  }

  // Utility methods for user feedback
  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar'],
    });
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 4000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar'],
    });
  }
}
