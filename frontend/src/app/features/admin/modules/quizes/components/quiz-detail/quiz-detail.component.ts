// src/app/features/admin/modules/quizzes/components/quiz-detail/quiz-detail.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, BehaviorSubject, EMPTY } from 'rxjs';
import { takeUntil, switchMap, filter } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { QuizService } from '../../services/quiz.service';
import { Quiz, QuizStats } from '@core/models/quiz.model';
import { ConfirmDialogComponent } from '@features/admin/modules/user-management/components/confirm-dialog/confirm-dialog';
import { SharedModule } from '@shared/shared.module';
@Component({
  selector: 'app-quiz-detail',
  templateUrl: './quiz-detail.component.html',
  styleUrls: ['./quiz-detail.component.scss'],
  imports: [SharedModule]
})
export class QuizDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  quiz$ = new BehaviorSubject<Quiz | null>(null);
  stats$ = new BehaviorSubject<QuizStats | null>(null);
  loading$ = new BehaviorSubject<boolean>(false);
  statsLoading$ = new BehaviorSubject<boolean>(false);

  quizId: string | null = null;
  activeTab = 0;

  // Tab configuration
  tabs = [
    { label: 'Overview', icon: 'info' },
    { label: 'Questions', icon: 'quiz' },
    { label: 'Statistics', icon: 'analytics' },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private quizService: QuizService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.route.params
      .pipe(
        takeUntil(this.destroy$),
        switchMap((params) => {
          const id = params['id'];

          // Validate that we have a valid quiz ID
          if (!id || typeof id !== 'string') {
            this.snackBar.open('Invalid quiz ID', 'Close', { duration: 3000 });
            this.router.navigate(['/admin/quizzes']);
            return EMPTY;
          }

          this.quizId = id;
          this.loading$.next(true);

          // Now we can safely call the service with a guaranteed string
          return this.quizService.getQuizById(this.quizId);
        }),
        filter(Boolean) // Filter out any null/undefined values
      )
      .subscribe({
        next: (quiz) => {
          this.quiz$.next(quiz);
          this.loading$.next(false);
          // Load stats if quiz is published
          if (quiz.isPublished) {
            this.loadQuizStats();
          }
        },
        error: (error) => {
          this.snackBar.open(
            `Failed to load quiz: ${error.message || 'Unknown error'}`,
            'Close',
            { duration: 5000 }
          );
          this.loading$.next(false);
          this.router.navigate(['/admin/quizzes']);
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load quiz statistics
   */
  private loadQuizStats(): void {
    // Add null check for quizId
    if (!this.quizId) {
      console.warn('Cannot load stats: Quiz ID is null');
      return;
    }

    this.statsLoading$.next(true);
    this.quizService
      .getQuizStats(this.quizId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.stats$.next(stats);
          this.statsLoading$.next(false);
        },
        error: (error) => {
          console.error('Failed to load quiz stats:', error);
          this.statsLoading$.next(false);
          // Don't show error to user for stats as it's not critical
        },
      });
  }

  /**
   * Handle tab change
   */
  onTabChange(index: number): void {
    this.activeTab = index;

    // Load stats when statistics tab is selected
    if (index === 2 && !this.stats$.value && this.quiz$.value?.isPublished) {
      this.loadQuizStats();
    }
  }

  /**
   * Navigate to edit quiz
   */
  editQuiz(): void {
    if (!this.quizId) {
      this.snackBar.open('Cannot edit: Quiz ID is missing', 'Close', {
        duration: 3000,
      });
      return;
    }
    this.router.navigate(['/admin/quizzes', this.quizId, 'edit']);
  }

  /**
   * Toggle quiz published status
   */
  togglePublished(): void {
    const quiz = this.quiz$.value;
    if (!quiz || !this.quizId) {
      this.snackBar.open('Cannot update: Quiz not found', 'Close', {
        duration: 3000,
      });
      return;
    }

    const action = quiz.isPublished ? 'unpublish' : 'publish';
    const serviceCall = quiz.isPublished
      ? this.quizService.unpublishQuiz(this.quizId)
      : this.quizService.publishQuiz(this.quizId);

    serviceCall.pipe(takeUntil(this.destroy$)).subscribe({
      next: (updatedQuiz) => {
        this.quiz$.next(updatedQuiz);
        this.snackBar.open(`Quiz ${action}ed successfully`, 'Close', {
          duration: 3000,
        });

        // Clear stats if unpublished
        if (!updatedQuiz.isPublished) {
          this.stats$.next(null);
        }
      },
      error: (error) => {
        this.snackBar.open(
          `Failed to ${action} quiz: ${error.message || 'Unknown error'}`,
          'Close',
          { duration: 5000 }
        );
      },
    });
  }

  /**
   * Delete quiz with confirmation
   */
  deleteQuiz(): void {
    const quiz = this.quiz$.value;
    if (!quiz || !this.quizId) {
      this.snackBar.open('Cannot delete: Quiz not found', 'Close', {
        duration: 3000,
      });
      return;
    }

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
      if (confirmed && this.quizId) {
        this.quizService
          .deleteQuiz(this.quizId)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.snackBar.open('Quiz deleted successfully', 'Close', {
                duration: 3000,
              });
              this.router.navigate(['/admin/quizzes']);
            },
            error: (error) => {
              this.snackBar.open(
                `Failed to delete quiz: ${error.message || 'Unknown error'}`,
                'Close',
                { duration: 5000 }
              );
            },
          });
      }
    });
  }

  /**
   * Navigate back to quiz list
   */
  goBack(): void {
    this.router.navigate(['/admin/quizzes']);
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
  formatDate(dateString: string | Date): string {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid date';
    }
  }

  /**
   * Format duration in minutes
   */
  formatDuration(minutes: number): string {
    if (!minutes || minutes < 1) {
      return 'No time limit';
    }

    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }

    return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${
      remainingMinutes !== 1 ? 's' : ''
    }`;
  }

  /**
   * Get question type display text
   */
  getQuestionTypeText(type: string): string {
    switch (type) {
      case 'MULTIPLE_CHOICE':
        return 'Multiple Choice';
      case 'TRUE_FALSE':
        return 'True/False';
      default:
        return type;
    }
  }

  /**
   * Calculate total quiz points
   */
  getTotalPoints(quiz: Quiz): number {
    if (!quiz.questions || quiz.questions.length === 0) {
      return 0;
    }
    return quiz.questions.reduce(
      (total, question) => total + (question.points || 0),
      0
    );
  }

  /**
   * Get average score percentage
   */
  getAverageScorePercentage(stats: QuizStats): number {
    const quiz = this.quiz$.value;
    if (!quiz) return 0;

    const totalPossiblePoints = this.getTotalPoints(quiz);
    if (totalPossiblePoints === 0) return 0;

    return Math.round((stats.averageScore / totalPossiblePoints) * 100);
  }

  /**
   * Check if quiz has questions
   */
  hasQuestions(): boolean {
    const quiz = this.quiz$.value;
    return !!(quiz?.questions && quiz.questions.length > 0);
  }

  /**
   * Get question count
   */
  getQuestionCount(): number {
    const quiz = this.quiz$.value;
    return quiz?.questions?.length || 0;
  }
}
