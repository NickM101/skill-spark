// src/app/features/admin/modules/quizzes/components/quiz-list/quiz-list.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, BehaviorSubject, Observable, combineLatest } from 'rxjs';
import {
  takeUntil,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  map,
} from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { QuizService } from '../../services/quiz.service';
import { ConfirmDialogComponent } from '@features/admin/modules/user-management/components/confirm-dialog/confirm-dialog';
import { QuizFilters, Quiz } from '@core/models/quiz.model';
import { SharedModule } from '@shared/shared.module';

@Component({
  selector: 'app-quiz-list',
  templateUrl: './quiz-list.component.html',
  styleUrls: ['./quiz-list.component.scss'],
  imports: [SharedModule]
})
export class QuizListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private filtersSubject = new BehaviorSubject<QuizFilters>({
    page: 1,
    limit: 10,
  });

  quizzes$: Observable<Quiz[]> = new Observable<Quiz[]>();
  loading$ = new BehaviorSubject<boolean>(false);
  pagination: any = {};

  // Filter controls
  searchControl = '';
  publishedFilter: boolean | undefined = undefined;

  // Table columns
  displayedColumns: string[] = [
    'title',
    'course',
    'questions',
    'attempts',
    'published',
    'createdAt',
    'actions',
  ];

  constructor(
    private quizService: QuizService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.initializeQuizStream();
  }

  ngOnInit(): void {
    this.setupSearchDebounce();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize the quiz data stream
   */
  private initializeQuizStream(): void {
    this.quizzes$ = this.filtersSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((filters) => {
        this.loading$.next(true);
        return this.quizService.getAllQuizzes(filters);
      }),
      map((response) => {
        this.loading$.next(false);
        this.pagination = response.pagination;
        return response.quizzes;
      }),
      takeUntil(this.destroy$)
    );
  }

  /**
   * Setup search input debouncing
   */
  private setupSearchDebounce(): void {
    // In a real app, you'd use reactive forms for better debouncing
    // For MVP, we'll handle it in the search method
  }

  /**
   * Handle search input
   */
  onSearch(): void {
    this.updateFilters({
      search: this.searchControl || undefined,
      page: 1,
    });
  }

  /**
   * Handle published filter change
   */
  onPublishedFilterChange(): void {
    this.updateFilters({
      isPublished: this.publishedFilter,
      page: 1,
    });
  }

  /**
   * Handle page change
   */
  onPageChange(event: any): void {
    this.updateFilters({
      page: event.pageIndex + 1,
      limit: event.pageSize,
    });
  }

  /**
   * Update filters and trigger new data fetch
   */
  private updateFilters(newFilters: Partial<QuizFilters>): void {
    const currentFilters = this.filtersSubject.value;
    this.filtersSubject.next({ ...currentFilters, ...newFilters });
  }

  /**
   * Navigate to create quiz page
   */
  createQuiz(): void {
    this.router.navigate(['/admin/quizzes/create']);
  }

  /**
   * Navigate to edit quiz page
   */
  editQuiz(quiz: Quiz): void {
    this.router.navigate(['/admin/quizzes', quiz.id, 'edit']);
  }

  /**
   * View quiz details
   */
  viewQuiz(quiz: Quiz): void {
    this.router.navigate(['/admin/quizzes', quiz.id]);
  }

  /**
   * Toggle quiz published status
   */
  togglePublished(quiz: Quiz): void {
    const action = quiz.isPublished ? 'unpublish' : 'publish';
    const serviceCall = quiz.isPublished
      ? this.quizService.unpublishQuiz(quiz.id)
      : this.quizService.publishQuiz(quiz.id);

    serviceCall.pipe(takeUntil(this.destroy$)).subscribe({
      next: (updatedQuiz) => {
        this.snackBar.open(`Quiz ${action}ed successfully`, 'Close', {
          duration: 3000,
        });
        // Refresh the list
        this.refreshList();
      },
      error: (error) => {
        this.snackBar.open(
          `Failed to ${action} quiz: ${error.message}`,
          'Close',
          { duration: 5000 }
        );
      },
    });
  }

  /**
   * Delete quiz with confirmation
   */
  deleteQuiz(quiz: Quiz): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Quiz',
        message: `Are you sure you want to delete "${quiz.title}"? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.quizService
          .deleteQuiz(quiz.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.snackBar.open('Quiz deleted successfully', 'Close', {
                duration: 3000,
              });
              this.refreshList();
            },
            error: (error) => {
              this.snackBar.open(
                `Failed to delete quiz: ${error.message}`,
                'Close',
                { duration: 5000 }
              );
            },
          });
      }
    });
  }

  /**
   * Refresh the quiz list
   */
  refreshList(): void {
    const currentFilters = this.filtersSubject.value;
    this.filtersSubject.next({ ...currentFilters });
  }

  /**
   * Get status badge class
   */
  getStatusClass(quiz: Quiz): string {
    return quiz.isPublished ? 'badge-success' : 'badge-secondary';
  }

  /**
   * Get status text
   */
  getStatusText(quiz: Quiz): string {
    return quiz.isPublished ? 'Published' : 'Draft';
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
}
