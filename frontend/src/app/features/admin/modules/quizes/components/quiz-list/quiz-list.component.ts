// src/app/features/admin/modules/quizzes/components/quiz-list/quiz-list.component.ts
import { Component, OnInit, OnDestroy, Input, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
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
import { Course } from '@core/models/course.model';
import { SharedModule } from '@shared/shared.module';
import { CourseService } from '@features/admin/modules/course-management/services/admin-course.service';

@Component({
  selector: 'app-quiz-list',
  templateUrl: './quiz-list.component.html',
  styleUrls: ['./quiz-list.component.scss'],
  imports: [SharedModule],
})
export class QuizListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private filtersSubject = new BehaviorSubject<QuizFilters>({
    page: 1,
    limit: 10,
  });
  quizzes$: Observable<Quiz[]> = new Observable<Quiz[]>();
  courses$: Observable<Course[]> = new Observable<Course[]>();
  loading$ = new BehaviorSubject<boolean>(false);
  pagination: any = {};
  searchControl = '';
  publishedFilter: boolean | undefined = undefined;
  displayedColumns: string[] = [
    'title',
    'course',
    'questions',
    'attempts',
    'published',
    'createdAt',
    'actions',
  ];

  @Input() courseId: string | null = null;
  @Input() readonly: boolean = false;

  constructor(
    private quizService: QuizService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeQuizStream();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['courseId']) {
      console.log('courseId changed:', this.courseId);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeQuizStream(): void {
    if (this.courseId) {
      console.log('Fetching quizzes for course ID:', this.courseId); // Log before fetching
      this.loading$.next(true);
      this.quizService.getQuizzesByCourse(this.courseId).subscribe({
        next: (quizzes) => {
          console.log('Fetched Quizzes:', quizzes); // Log the fetched quizzes
          this.quizzes$ = of(quizzes);
          this.loading$.next(false);
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error fetching quizzes:', error);
          this.loading$.next(false);
        },
      });
    } else {
      console.log('No courseId provided');
      this.quizzes$ = of([]);
      this.loading$.next(false);
    }
  }

  onSearch(): void {
    this.updateFilters({ search: this.searchControl || undefined, page: 1 });
  }

  onPublishedFilterChange(): void {
    this.updateFilters({ isPublished: this.publishedFilter, page: 1 });
  }

  onPageChange(event: any): void {
    this.updateFilters({ page: event.pageIndex + 1, limit: event.pageSize });
  }

  private updateFilters(newFilters: Partial<QuizFilters>): void {
    const currentFilters = this.filtersSubject.value;
    this.filtersSubject.next({ ...currentFilters, ...newFilters });
  }

  createQuiz(): void {
    this.router.navigate(['/admin/quizzes/create']);
  }

  editQuiz(quiz: Quiz): void {
    this.router.navigate(['/admin/quizzes', quiz.id, 'edit']);
  }

  viewQuiz(quiz: Quiz): void {
    this.router.navigate(['/admin/quizzes', quiz.id]);
  }

  viewQuizzesForCourse(courseId: string): void {
    this.router.navigate(['/admin/courses', courseId, 'quizzes']);
  }

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

  refreshList(): void {
    const currentFilters = this.filtersSubject.value;
    this.filtersSubject.next({ ...currentFilters });
  }

  getStatusClass(quiz: Quiz): string {
    return quiz.isPublished ? 'badge-success' : 'badge-secondary';
  }

  getStatusText(quiz: Quiz): string {
    return quiz.isPublished ? 'Published' : 'Draft';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }
}
