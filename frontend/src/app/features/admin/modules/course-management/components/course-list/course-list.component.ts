// src/app/features/admin/modules/course-management/components/course-list/course-list.component.ts

import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { Subject, combineLatest } from 'rxjs';
import {
  takeUntil,
  debounceTime,
  startWith,
  distinctUntilChanged,
} from 'rxjs/operators';
import { SharedModule } from '@shared/shared.module';
import { Category } from '@core/models/category.model';
import {
  Course,
  CourseStats,
  CourseLevel,
  CourseListResponse,
} from '@core/models/course.model';
import { User } from '@core/models/user.model';
import { CourseQueryParams, CourseService } from '../../services/admin-course.service';
import { CourseConfirmDialogComponent } from '../course-confirm-dialog/course-confirm-dialog.component';

@Component({
  selector: 'app-course-list',
  templateUrl: './course-list.component.html',
  styleUrls: ['./course-list.component.scss'],
  imports: [SharedModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  filterForm: FormGroup;
  courses: Course[] = [];
  categories: Category[] = [];
  instructors: User[] = [];
  stats: CourseStats | null = null;
  loading$ = this.courseService.loading$;

  // Pagination
  totalCourses = 0;
  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  pageSizeOptions = [5, 10, 25, 50];

  // Table columns
  displayedColumns = [
    'thumbnail',
    'title',
    'instructor',
    'category',
    'level',
    'enrollments',
    'status',
    'actions',
  ];

  // Enums for template
  CourseLevel = CourseLevel;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private courseService: CourseService,
    private cdr: ChangeDetectorRef
  ) {
    this.filterForm = this.createFilterForm();
  }

  ngOnInit(): void {
    this.initializeData();
    this.setupFilterSubscription();
    this.loadInitialData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createFilterForm(): FormGroup {
    return this.fb.group({
      search: [''],
      categoryId: [''],
      level: [''],
      isPublished: [''],
      instructorId: [''],
      sortBy: ['createdAt'],
      sortOrder: ['desc'],
    });
  }

  private initializeData(): void {
    // Load categories
    this.courseService
      .getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories) => {
          this.categories = categories;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading categories:', error);
          this.showErrorMessage('Failed to load categories');
        },
      });

    // Load instructors
    this.courseService
      .loadInstructors()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (instructors) => {
          this.instructors = instructors;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading instructors:', error);
          // Don't show error for instructors as it might not be critical
        },
      });

    // Load stats
    this.courseService
      .getCourseStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.stats = stats;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading stats:', error);
        },
      });
  }

  private setupFilterSubscription(): void {
    // Watch form changes and load courses
    this.filterForm.valueChanges
      .pipe(
        startWith(this.filterForm.value),
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.currentPage = 1; // Reset to first page on filter change
        this.loadCourses();
      });
  }

  private loadInitialData(): void {
    this.loadCourses();
  }

  private loadCourses(): void {
    const formValue = this.filterForm.value;

    const params: CourseQueryParams = {
      page: this.currentPage,
      limit: this.pageSize,
      search: formValue.search?.trim() || undefined,
      categoryId: formValue.categoryId || undefined,
      level: formValue.level || undefined,
      isPublished:
        formValue.isPublished === '' ? undefined : formValue.isPublished,
      instructorId: formValue.instructorId || undefined,
      sortBy: formValue.sortBy || 'createdAt',
      sortOrder: formValue.sortOrder || 'desc',
    };

    this.courseService
      .getCourses(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: CourseListResponse) => {
          console.log(response)
          this.courses = response.courses;
          this.totalCourses = response.total;
          this.totalPages =
            response.totalPages || Math.ceil(response.total / this.pageSize);
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading courses:', error);
          this.showErrorMessage('Failed to load courses');
        },
      });
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex + 1;
    this.loadCourses();
  }

  onCreateCourse(): void {
    this.router.navigate(['/admin/courses/new']);
  }

  onEditCourse(courseId: string): void {
    this.router.navigate(['/admin/courses', courseId, 'edit']);
  }

  onViewCourse(courseId: string): void {
    this.router.navigate(['/admin/courses', courseId]);
  }

  onPublishCourse(course: Course): void {
    const action = course.isPublished ? 'unpublish' : 'publish';

    // Show confirmation dialog
    const dialogRef = this.dialog.open(CourseConfirmDialogComponent, {
      width: '600px',
      data: {
        type: course.isPublished ? 'unpublish' : 'publish',
        course: course,
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        const serviceCall = course.isPublished
          ? this.courseService.unpublishCourse(course.id)
          : this.courseService.publishCourse(course.id);

        serviceCall.pipe(takeUntil(this.destroy$)).subscribe({
          next: (updatedCourse) => {
            // Update local course list
            const index = this.courses.findIndex((c) => c.id === course.id);
            if (index >= 0) {
              this.courses[index] = updatedCourse;
              this.cdr.markForCheck();
            }
            this.showSuccessMessage(`Course ${action}ed successfully`);

            // Refresh stats
            this.loadStats();
          },
          error: (error) => {
            console.error(`Error ${action}ing course:`, error);
            this.showErrorMessage(
              `Failed to ${action} course: ${error.message || 'Unknown error'}`
            );
          },
        });
      }
    });
  }

  onDeleteCourse(course: Course): void {
    const dialogRef = this.dialog.open(CourseConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Course',
        message: `Are you sure you want to delete "${course.title}"? This action cannot be undone and will remove all associated data.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        confirmColor: 'warn',
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.courseService
          .deleteCourse(course.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              // Remove from local list
              this.courses = this.courses.filter((c) => c.id !== course.id);
              this.totalCourses--;
              this.cdr.markForCheck();

              this.showSuccessMessage('Course deleted successfully');

              // Refresh stats and reload if needed
              this.loadStats();

              // If no courses left on current page, go to previous page
              if (this.courses.length === 0 && this.currentPage > 1) {
                this.currentPage--;
                this.loadCourses();
              }
            },
            error: (error) => {
              console.error('Error deleting course:', error);
              this.showErrorMessage(
                `Failed to delete course: ${error.message || 'Unknown error'}`
              );
            },
          });
      }
    });
  }

  onAssignInstructor(course: Course, instructorId: string): void {
    this.courseService
      .assignInstructor(course.id, instructorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedCourse) => {
          // Update local course list
          const index = this.courses.findIndex((c) => c.id === course.id);
          if (index >= 0) {
            this.courses[index] = updatedCourse;
            this.cdr.markForCheck();
          }
          this.showSuccessMessage('Instructor assigned successfully');
        },
        error: (error) => {
          console.error('Error assigning instructor:', error);
          this.showErrorMessage(
            `Failed to assign instructor: ${error.message || 'Unknown error'}`
          );
        },
      });
  }

  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      categoryId: '',
      level: '',
      isPublished: '',
      instructorId: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  }

  refreshCourses(): void {
    this.loadCourses();
    this.loadStats();
  }

  private loadStats(): void {
    this.courseService
      .getCourseStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (stats) => {
          this.stats = stats;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading stats:', error);
        },
      });
  }

  // Template helper methods
  getStatusChipColor(isPublished: boolean): string {
    return isPublished ? 'primary' : 'warn';
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

  getLevelLabel(level: CourseLevel): string {
    switch (level) {
      case CourseLevel.BEGINNER:
        return 'Beginner';
      case CourseLevel.INTERMEDIATE:
        return 'Intermediate';
      case CourseLevel.ADVANCED:
        return 'Advanced';
      default:
        return level;
    }
  }

  formatPrice(price?: number): string {
    return price ? `Ksh. ${price.toFixed(2)}` : 'Free';
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString();
  }

  getCategoryName(course: Course): string {
    return course.category?.name || 'Uncategorized';
  }

  getInstructorName(course: Course): string {
    if (course.instructor) {
      return `${course.instructor.firstName} ${course.instructor.lastName}`;
    }
    return 'Unassigned';
  }

  getInstructorEmail(course: Course): string {
    return course.instructor?.email || '';
  }

  canEditCourse(course: Course): boolean {
    // This would typically check user permissions
    // For now, assume admin can edit all courses
    return true;
  }

  canDeleteCourse(course: Course): boolean {
    // Only admin can delete courses
    return true;
  }

  canPublishCourse(course: Course): boolean {
    // Check if course has required data for publishing
    return this.courseService.canPublishCourse(course);
  }

  hasFiltersApplied(): boolean {
    const formValue = this.filterForm.value;
    return !!(
      formValue.search ||
      formValue.categoryId ||
      formValue.level ||
      formValue.isPublished !== '' ||
      formValue.instructorId
    );
  }

  getAppliedFiltersCount(): number {
    const formValue = this.filterForm.value;
    let count = 0;

    if (formValue.search) count++;
    if (formValue.categoryId) count++;
    if (formValue.level) count++;
    if (formValue.isPublished !== '') count++;
    if (formValue.instructorId) count++;

    return count;
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

  private showInfoMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
    });
  }

  // Template getters
  get hasCategories(): boolean {
    return this.categories.length > 0;
  }

  get hasInstructors(): boolean {
    return this.instructors.length > 0;
  }

  get hasCourses(): boolean {
    return this.courses.length > 0;
  }

  get isSearching(): boolean {
    return !!this.filterForm.get('search')?.value?.trim();
  }

  get pageIndex(): number {
    return this.currentPage - 1;
  }

  // TrackBy functions for ngFor optimization
  trackByCategory(index: number, category: Category): string {
    return category.id;
  }

  trackByInstructor(index: number, instructor: User): string {
    return instructor.id;
  }

  trackByCourse(index: number, course: Course): string {
    return course.id;
  }

  // Additional method for assign instructor dialog
  openAssignInstructorDialog(course: Course): void {
    // This would open a dialog to assign instructor
    // For now, we'll use a simple approach
    if (this.instructors.length === 0) {
      this.showInfoMessage(
        'No instructors available. Please create instructor accounts first.'
      );
      return;
    }

    // You could implement a proper dialog here
    // For demo purposes, we'll just assign the first instructor
    if (this.instructors.length > 0) {
      this.onAssignInstructor(course, this.instructors[0].id);
    }
  }
}
