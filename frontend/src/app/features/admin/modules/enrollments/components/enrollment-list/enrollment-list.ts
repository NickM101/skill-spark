import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { SelectionModel } from '@angular/cdk/collections';
import {
  Subject,
  debounceTime,
  distinctUntilChanged,
  takeUntil,
  startWith,
  combineLatest,
} from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Course } from '@core/models/course.model';
import { Enrollment, EnrollmentStatus, EnrollmentFilters } from '@core/models/enrollment.model';
import { User } from '@core/models/user.model';
import { EnrollmentService } from '../../services/enrollments.service';
import { CourseService } from '@features/admin/modules/course-management/services/admin-course.service';
import { SharedModule } from '@shared/shared.module';

@Component({
  selector: 'app-enrollment-list',
  templateUrl: './enrollment-list.html',
  styleUrls: ['./enrollment-list.scss'],
  imports: [SharedModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnrollmentListComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Data
  enrollments: Enrollment[] = [];
  filteredEnrollments: Enrollment[] = [];
  courses: Course[] = [];
  loading = false;

  // Pagination
  totalCount = 0;
  pageSize = 10;
  pageIndex = 0;
  pageSizeOptions = [5, 10, 25, 50];

  // Selection
  selection = new SelectionModel<Enrollment>(true, []);

  // Forms and Filters
  filterForm: FormGroup;
  quickFilters = {
    all: 'All Enrollments',
    active: 'Active',
    completed: 'Completed',
    dropped: 'Dropped',
  };
  activeQuickFilter = 'all';

  // Display
  displayedColumns: string[] = [
    'select',
    'student',
    'course',
    'status',
    'progress',
    'enrolledAt',
    'lastActivity',
    'actions',
  ];

  // Subjects
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  // Enums for template
  EnrollmentStatus = EnrollmentStatus;

  constructor(
    private enrollmentService: EnrollmentService,
    private courseService: CourseService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.filterForm = this.createFilterForm();
  }

  ngOnInit(): void {
    this.initializeData();
    this.setupSearch();
    this.setupFilterForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createFilterForm(): FormGroup {
    return this.fb.group({
      search: [''],
      courseId: [''],
      status: [''],
      startDate: [''],
      endDate: [''],
      sortBy: ['enrolledAt'],
      sortOrder: ['desc'],
    });
  }

  private initializeData(): void {
    this.loadCourses();
    this.loadEnrollments();
  }

  private setupSearch(): void {
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((searchTerm) => {
        this.filterForm.patchValue({ search: searchTerm });
        this.applyFilters();
      });
  }

  private setupFilterForm(): void {
    this.filterForm.valueChanges
      .pipe(
        startWith(this.filterForm.value),
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.applyFilters();
      });
  }

  private loadCourses(): void {
    this.courseService.getCourses({ limit: 10 }).subscribe({
      next: (response) => {
        this.courses = response.courses;
      },
      error: (error) => {
        this.showError('Failed to load courses');
      },
    });
  }

  private loadEnrollments(): void {
    this.loading = true;
    const filters: EnrollmentFilters = {
      page: this.pageIndex + 1,
      limit: this.pageSize,
      ...this.buildFilters(),
    };

    this.enrollmentService.getAllEnrollments(filters).subscribe({
      next: (response) => {
        this.enrollments = response.enrollments;
        this.totalCount = response.pagination.total;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.showError('Failed to load enrollments');
      },
    });
  }

  private buildFilters(): Partial<EnrollmentFilters> {
    const formValue = this.filterForm.value;
    const filters: Partial<EnrollmentFilters> = {};

    if (formValue.search) filters.search = formValue.search;
    if (formValue.courseId) filters.courseId = formValue.courseId;
    if (formValue.status) filters.status = formValue.status;
    if (formValue.sortBy) filters.sortBy = formValue.sortBy;
    if (formValue.sortOrder) filters.sortOrder = formValue.sortOrder;

    return filters;
  }

  // Event Handlers
  onSearch(searchTerm: string): void {
    this.searchSubject.next(searchTerm);
  }

  onQuickFilter(filter: string): void {
    this.activeQuickFilter = filter;

    switch (filter) {
      case 'active':
        this.filterForm.patchValue({ status: EnrollmentStatus.ACTIVE });
        break;
      case 'completed':
        this.filterForm.patchValue({ status: EnrollmentStatus.COMPLETED });
        break;
      case 'dropped':
        this.filterForm.patchValue({ status: EnrollmentStatus.DROPPED });
        break;
      default:
        this.filterForm.patchValue({ status: '' });
    }
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadEnrollments();
  }

  onSortChange(sort: Sort): void {
    this.filterForm.patchValue({
      sortBy: sort.active,
      sortOrder: sort.direction || 'desc',
    });
  }

  applyFilters(): void {
    this.pageIndex = 0;
    this.loadEnrollments();
  }

  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      courseId: '',
      status: '',
      startDate: '',
      endDate: '',
      sortBy: 'enrolledAt',
      sortOrder: 'desc',
    });
    this.activeQuickFilter = 'all';
  }

  // Selection Methods
  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.enrollments.length;
    return numSelected === numRows;
  }

  masterToggle(): void {
    this.isAllSelected()
      ? this.selection.clear()
      : this.enrollments.forEach((row) => this.selection.select(row));
  }

  toggleRow(row: Enrollment): void {
    this.selection.toggle(row);
  }

  // Actions
  viewEnrollment(enrollment: Enrollment): void {
    // Navigate to enrollment detail
    // this.router.navigate(['/admin/enrollments', enrollment.id]);
  }

  editEnrollment(enrollment: Enrollment): void {
    // Open edit dialog
    // const dialogRef = this.dialog.open(EditEnrollmentDialogComponent, {
    //   width: '600px',
    //   data: enrollment
    // });
  }

  deleteEnrollment(enrollment: Enrollment): void {
    if (confirm('Are you sure you want to delete this enrollment?')) {
      this.enrollmentService.deleteEnrollment(enrollment.id).subscribe({
        next: () => {
          this.showSuccess('Enrollment deleted successfully');
          this.loadEnrollments();
        },
        error: () => {
          this.showError('Failed to delete enrollment');
        },
      });
    }
  }

  bulkDelete(): void {
    const selectedIds = this.selection.selected.map((e) => e.id);
    if (selectedIds.length === 0) return;

    if (
      confirm(
        `Are you sure you want to delete ${selectedIds.length} enrollments?`
      )
    ) {
      // Implement bulk delete
      // this.enrollmentService.bulkDeleteEnrollments(selectedIds).subscribe({
      //   next: () => {
      //     this.showSuccess(`${selectedIds.length} enrollments deleted successfully`);
      //     this.selection.clear();
      //     this.loadEnrollments();
      //   },
      //   error: () => {
      //     this.showError('Failed to delete enrollments');
      //   }
      // });
    }
  }

  exportData(): void {
    const filters = this.buildFilters();
    this.enrollmentService.exportEnrollments(filters).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `enrollments-${
          new Date().toISOString().split('T')[0]
        }.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.showSuccess('Data exported successfully');
      },
      error: () => {
        this.showError('Failed to export data');
      },
    });
  }

  // Utility Methods
  getStatusColor(status: string): string {
    return this.enrollmentService.getEnrollmentStatusColor(status);
  }

  getProgressColor(progress: number): string {
    return this.enrollmentService.getProgressColor(progress);
  }

  formatProgress(progress: number): string {
    return this.enrollmentService.formatProgress(progress);
  }

  getCourseName(courseId: string): string {
    const course = this.courses.find((c) => c.id === courseId);
    return course?.title || 'Unknown Course';
  }

  getStudentName(user?: User): string {
    if (!user) return 'Unknown Student';
    return `${user.firstName} ${user.lastName}`;
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
