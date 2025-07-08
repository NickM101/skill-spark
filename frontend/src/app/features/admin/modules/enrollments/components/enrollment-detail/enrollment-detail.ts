import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil, switchMap, combineLatest } from 'rxjs';
import { SharedModule } from '@shared/shared.module';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Enrollment, EnrollmentStatus, UpdateEnrollmentDto } from '@core/models/enrollment.model';
import { Progress } from '@core/models/progress.model';
import { EnrollmentService } from '../../services/enrollments.service';


@Component({
  selector: 'app-enrollment-detail',
  templateUrl: './enrollment-detail.html',
  styleUrls: ['./enrollment-detail.scss'],
  imports: [SharedModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnrollmentDetailComponent implements OnInit, OnDestroy {
  enrollment: Enrollment | null = null;
  progressData: Progress[] = [];
  loading = false;
  editing = false;

  // Forms
  editForm: FormGroup;

  // Progress Statistics
  progressStats = {
    totalLessons: 0,
    completedLessons: 0,
    inProgressLessons: 0,
    averageTimePerLesson: 0,
    totalTimeSpent: 0,
    lastActivity: null as Date | null,
  };

  // Enums for template
  EnrollmentStatus = EnrollmentStatus;
  statusOptions = [
    { value: EnrollmentStatus.ACTIVE, label: 'Active' },
    { value: EnrollmentStatus.COMPLETED, label: 'Completed' },
    { value: EnrollmentStatus.DROPPED, label: 'Dropped' },
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private enrollmentService: EnrollmentService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.editForm = this.createEditForm();
  }

  ngOnInit(): void {
    this.loadEnrollmentData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createEditForm(): FormGroup {
    return this.fb.group({
      status: ['', Validators.required],
      progressPercent: [0, [Validators.min(0), Validators.max(100)]],
      notes: [''],
    });
  }

  private loadEnrollmentData(): void {
    this.loading = true;

    this.route.params
      .pipe(
        switchMap((params) => {
          const enrollmentId = params['id'];
          return combineLatest([
            this.enrollmentService.getEnrollmentById(enrollmentId),
            this.enrollmentService.getEnrollmentProgress(enrollmentId),
          ]);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: ([enrollment, progressResponse]) => {
          this.enrollment = enrollment;
          this.progressData = progressResponse.progress || [];
          this.calculateProgressStats();
          this.populateEditForm();
          this.loading = false;
        },
        error: (error) => {
          this.loading = false;
          this.showError('Failed to load enrollment data');
          console.error('Error loading enrollment:', error);
        },
      });
  }

  private calculateProgressStats(): void {
    if (!this.progressData.length) return;

    this.progressStats = {
      totalLessons: this.progressData.length,
      completedLessons: this.progressData.filter((p) => p.isCompleted).length,
      inProgressLessons: this.progressData.filter((p) => !p.isCompleted).length,
      averageTimePerLesson: 0, // Would need additional data
      totalTimeSpent: 0, // Would need additional data
      lastActivity: this.getLastActivity(),
    };
  }

  private getLastActivity(): Date | null {
    if (!this.progressData.length) return null;

    const lastProgress = this.progressData
      .filter((p) => p.completedAt)
      .sort(
        (a, b) =>
          new Date(b.completedAt!).getTime() -
          new Date(a.completedAt!).getTime()
      )[0];

    return lastProgress ? new Date(lastProgress.completedAt!) : null;
  }

  private populateEditForm(): void {
    if (!this.enrollment) return;

    this.editForm.patchValue({
      status: this.enrollment.status,
      progressPercent: this.enrollment.progressPercent,
      notes: '',
    });
  }

  // Event Handlers
  toggleEdit(): void {
    this.editing = !this.editing;
    if (!this.editing) {
      this.populateEditForm(); // Reset form if canceling
    }
  }

  saveChanges(): void {
    if (!this.enrollment || !this.editForm.valid) return;

    const updateData: UpdateEnrollmentDto = {
      status: this.editForm.value.status,
      progressPercent: this.editForm.value.progressPercent,
    };

    this.enrollmentService
      .updateEnrollment(this.enrollment.id, updateData)
      .subscribe({
        next: (updatedEnrollment) => {
          this.enrollment = updatedEnrollment;
          this.editing = false;
          this.showSuccess('Enrollment updated successfully');
        },
        error: (error) => {
          this.showError('Failed to update enrollment');
          console.error('Error updating enrollment:', error);
        },
      });
  }

  deleteEnrollment(): void {
    if (!this.enrollment) return;

    const confirmMessage = `Are you sure you want to delete this enrollment for ${this.getStudentName()}?`;
    if (!confirm(confirmMessage)) return;

    this.enrollmentService.deleteEnrollment(this.enrollment.id).subscribe({
      next: () => {
        this.showSuccess('Enrollment deleted successfully');
        this.router.navigate(['/admin/enrollments']);
      },
      error: (error) => {
        this.showError('Failed to delete enrollment');
        console.error('Error deleting enrollment:', error);
      },
    });
  }

  markLessonComplete(lessonId: string): void {
    if (!this.enrollment) return;

    this.enrollmentService
      .markLessonComplete(lessonId, this.enrollment.courseId)
      .subscribe({
        next: () => {
          this.loadEnrollmentData(); // Refresh data
          this.showSuccess('Lesson marked as complete');
        },
        error: (error) => {
          this.showError('Failed to update lesson progress');
          console.error('Error updating lesson:', error);
        },
      });
  }

  markLessonIncomplete(lessonId: string): void {
    if (!this.enrollment) return;

    this.enrollmentService
      .markLessonIncomplete(lessonId, this.enrollment.courseId)
      .subscribe({
        next: () => {
          this.loadEnrollmentData(); // Refresh data
          this.showSuccess('Lesson marked as incomplete');
        },
        error: (error) => {
          this.showError('Failed to update lesson progress');
          console.error('Error updating lesson:', error);
        },
      });
  }

  viewCourse(): void {
    if (!this.enrollment) return;
    this.router.navigate(['/admin/courses', this.enrollment.courseId]);
  }

  viewStudent(): void {
    if (!this.enrollment) return;
    this.router.navigate(['/admin/users', this.enrollment.userId]);
  }

  goBack(): void {
    this.router.navigate(['/admin/enrollments']);
  }

  // Utility Methods
  getStudentName(): string {
    if (!this.enrollment?.user) return 'Unknown Student';
    return `${this.enrollment.user.firstName} ${this.enrollment.user.lastName}`;
  }

  getCourseName(): string {
    return this.enrollment?.course?.title || 'Unknown Course';
  }

  getStatusColor(status: string): string {
    return this.enrollmentService.getEnrollmentStatusColor(status);
  }

  getProgressColor(progress: number): string {
    return this.enrollmentService.getProgressColor(progress);
  }

  formatProgress(progress: number): string {
    return this.enrollmentService.formatProgress(progress);
  }

  trackByLessonId(index: number, progress: any): number | string {
    return progress.lessonId || index;
  }

  getEnrollmentDuration(): string {
    if (!this.enrollment) return '';
    return this.enrollmentService.getEnrollmentDuration(
      this.enrollment.enrolledAt,
      this.enrollment.completedAt
    );
  }

  getLessonIcon(lessonType: string): string {
    switch (lessonType) {
      case 'VIDEO':
        return 'play_circle';
      case 'PDF':
        return 'picture_as_pdf';
      case 'TEXT':
        return 'article';
      default:
        return 'book';
    }
  }

  getCompletionRate(): number {
    if (this.progressStats.totalLessons === 0) return 0;
    return Math.round(
      (this.progressStats.completedLessons / this.progressStats.totalLessons) *
        100
    );
  }

  exportProgressData(): void {
    if (!this.enrollment) return;

    // Implementation for exporting progress data
    const progressData = {
      enrollment: this.enrollment,
      progress: this.progressData,
      stats: this.progressStats,
    };

    const blob = new Blob([JSON.stringify(progressData, null, 2)], {
      type: 'application/json',
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `enrollment-${this.enrollment.id}-progress.json`;
    link.click();
    window.URL.revokeObjectURL(url);

    this.showSuccess('Progress data exported successfully');
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar'],
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
  }
}
