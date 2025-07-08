import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy, // Keep ChangeDetectionStrategy
  ViewChild,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { FormBuilder, FormGroup } from '@angular/forms';
import {
  Subject,
  takeUntil,
  combineLatest,
  debounceTime, // Keep debounceTime
  distinctUntilChanged,
} from 'rxjs';
import { Course } from '@core/models/course.model';
import { Router } from '@angular/router'; // Import Router
import { EnrollmentService } from '../../services/enrollments.service';
import { CourseService } from '@features/admin/modules/course-management/services/admin-course.service';
import { Enrollment, EnrollmentFilters } from '@core/models/enrollment.model';
import { SharedModule } from '@shared/shared.module';

interface ProgressTableRow {
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseName: string;
  enrollmentId: string;
  enrolledAt: string;
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  lastActivity: string;
  status: string;
}

@Component({
  selector: 'app-enrollment-progress',
  templateUrl: './enrollment-progress.html',
  styleUrls: ['./enrollment-progress.scss'],
  imports: [SharedModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnrollmentProgressComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Data
  dataSource = new MatTableDataSource<ProgressTableRow>([]);
  courses: Course[] = [];
  loading = false;

  // Filters
  filterForm: FormGroup;
  courseId: string | null = null;

  // Table
  displayedColumns: string[] = [
    'student',
    'course',
    'progress',
    'completedLessons',
    'lastActivity',
    'status',
    'actions',
  ];

  // Stats
  overallStats = {
    totalEnrollments: 0,
    averageProgress: 0,
    completedEnrollments: 0,
    activeEnrollments: 0,
  };

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private enrollmentService: EnrollmentService,
    private courseService: CourseService, // Keep courseService
    private router: Router, // Inject Router
    private fb: FormBuilder
  ) {
    this.filterForm = this.createFilterForm();
  }

  ngOnInit(): void {
    this.setupRoute();
    this.loadInitialData();
    this.setupFilters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createFilterForm(): FormGroup {
    return this.fb.group({
      courseId: [''],
      search: [''],
      minProgress: [0],
      maxProgress: [100],
      status: [''],
    });
  }

  private setupRoute(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.courseId = params['courseId'] || null;
      if (this.courseId) {
        this.filterForm.patchValue({ courseId: this.courseId });
      }
    });
  }

  private loadInitialData(): void {
    this.loading = true;

    combineLatest([
      this.courseService.getCourses({ limit: 1000 }),
      this.loadProgressData(),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([coursesResponse]) => {
          this.courses = coursesResponse.courses;
          this.loading = false;
        },
        error: (error) => {
          this.loading = false;
          console.error('Error loading data:', error);
        },
      });
  }

  private loadProgressData(): Promise<void> {
    return new Promise((resolve, reject) => {
      const filters = this.buildFilters();

      this.enrollmentService.getAllEnrollments(filters).subscribe({
        next: (response) => {
          const progressRows = this.transformToProgressRows(
            response.enrollments
          );
          this.dataSource.data = progressRows;
          this.calculateOverallStats(response.enrollments);
          resolve();
        },
        error: reject,
      });
    });
  }

  private transformToProgressRows(
    enrollments: Enrollment[]
  ): ProgressTableRow[] {
    return enrollments.map((enrollment) => ({
      studentId: enrollment.userId,
      studentName: enrollment.user
        ? `${enrollment.user.firstName} ${enrollment.user.lastName}`
        : 'Unknown', // Keep 'Unknown' for studentName
      studentEmail: enrollment.user?.email || '',
      courseId: enrollment.courseId,
      courseName: enrollment.course?.title || 'Unknown Course',
      enrollmentId: enrollment.id,
      enrolledAt: enrollment.enrolledAt.toISOString(),
      progressPercent: enrollment.progressPercent,
      completedLessons: this.getCompletedLessonsCount(enrollment),
      totalLessons: this.getTotalLessonsCount(enrollment), // Keep getTotalLessonsCount
      lastActivity: enrollment.updatedAt.toISOString(),
      status: enrollment.status,
    }));
  }

  private getCompletedLessonsCount(enrollment: Enrollment): number {
    if (!enrollment.progress) return 0;
    return enrollment.progress.filter((p) => p.isCompleted).length;
  }

  private getTotalLessonsCount(enrollment: Enrollment): number {
    return enrollment.course?.lessons?.length || 0;
  }

  private calculateOverallStats(enrollments: Enrollment[]): void {
    this.overallStats = {
      totalEnrollments: enrollments.length,
      averageProgress: this.calculateAverageProgress(enrollments),
      completedEnrollments: enrollments.filter((e) => e.status === 'COMPLETED')
        .length,
      activeEnrollments: enrollments.filter((e) => e.status === 'ACTIVE')
        .length,
    };
  }

  private calculateAverageProgress(enrollments: Enrollment[]): number {
    if (enrollments.length === 0) return 0;
    const totalProgress = enrollments.reduce(
      (sum, e) => sum + e.progressPercent,
      0
    );
    return Math.round(totalProgress / enrollments.length);
  }

  private setupFilters(): void {
    this.filterForm.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.applyFilters();
      });
  }

  private buildFilters(): EnrollmentFilters {
    const formValue = this.filterForm.value;
    const filters: EnrollmentFilters = {};

    if (formValue.courseId) filters.courseId = formValue.courseId;
    if (formValue.search) filters.search = formValue.search;
    if (formValue.status) filters.status = formValue.status;

    return filters;
  }

  // Event Handlers
  applyFilters(): void {
    this.loadProgressData();
  }

  clearFilters(): void {
    this.filterForm.reset({
      courseId: this.courseId || '',
      search: '',
      minProgress: 0,
      maxProgress: 100,
      status: '',
    });
  }

  exportData(): void {
    const data = this.dataSource.data;
    const csvContent = this.convertToCSV(data);
    this.downloadCSV(csvContent, 'enrollment-progress.csv');
  }

  viewEnrollmentDetail(row: ProgressTableRow): void {
    // Navigate to enrollment detail
    this.router.navigate(['/admin/enrollments', row.enrollmentId]);
  }

  viewCourseProgress(courseId: string): void {
    this.enrollmentService.getCourseProgressForStudents(courseId).subscribe({
      next: (courseProgress) => {
        // Open course progress dialog or navigate
        console.log('Course Progress:', courseProgress);
      },
      error: (error) => {
        console.error('Error loading course progress:', error);
      },
    });
  }

  // Utility Methods
  getProgressColor(progress: number): string {
    return this.enrollmentService.getProgressColor(progress);
  }

  getStatusColor(status: string): string {
    return this.enrollmentService.getEnrollmentStatusColor(status);
  }

  formatProgress(progress: number): string {
    return this.enrollmentService.formatProgress(progress);
  }

  getCourseName(courseId: string): string {
    const course = this.courses.find((c) => c.id === courseId);
    return course?.title || 'Unknown Course';
  }

  getCompletionRate(completed: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  }

  private convertToCSV(data: ProgressTableRow[]): string {
    const headers = [
      'Student Name',
      'Student Email',
      'Course Name',
      'Progress %',
      'Completed Lessons',
      'Total Lessons',
      'Status',
      'Enrolled Date',
      'Last Activity',
    ];

    const csvRows = [
      headers.join(','),
      ...data.map((row) =>
        [
          `"${row.studentName}"`,
          `"${row.studentEmail}"`,
          `"${row.courseName}"`,
          row.progressPercent,
          row.completedLessons,
          row.totalLessons,
          row.status,
          new Date(row.enrolledAt).toLocaleDateString(),
          new Date(row.lastActivity).toLocaleDateString(),
        ].join(',')
      ),
    ];

    return csvRows.join('\n');
  }

  private downloadCSV(csvContent: string, filename: string): void {
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  // Track by function for performance
  trackByEnrollmentId(index: number, row: ProgressTableRow): string {
    return row.enrollmentId;
  }

  getTimeAgo(date: string): string {
    if (!date) return 'No activity';

    const now = new Date();
    const past = new Date(date);
    const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    const intervals: { [key: string]: number } = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60,
    };

    for (const [unit, value] of Object.entries(intervals)) {
      const count = Math.floor(seconds / value);
      if (count > 0) {
        return `${count} ${unit}${count > 1 ? 's' : ''} ago`;
      }
    }

    return 'Just now';
  }

  isColumnVisible(column: string): boolean {
    return this.displayedColumns.includes(column);
  }

  getColumnLabel(column: string): string {
    const labels: Record<string, string> = {
      student: 'Student',
      course: 'Course',
      progress: 'Progress',
      completedLessons: 'Lessons',
      lastActivity: 'Last Activity',
      status: 'Status',
      actions: 'Actions',
    };

    return labels[column] || column;
  }

  toggleColumn(column: string): void {
    const index = this.displayedColumns.indexOf(column);
    if (index > -1) {
      // Column is visible – remove it
      this.displayedColumns.splice(index, 1);
    } else {
      // Column is hidden – insert it at the default position
      const defaultOrder = [
        'student',
        'course',
        'progress',
        'completedLessons',
        'lastActivity',
        'status',
        'actions',
      ];
      const insertIndex = defaultOrder.indexOf(column);
      if (insertIndex === -1) {
        this.displayedColumns.push(column); // fallback
      } else {
        this.displayedColumns.splice(insertIndex, 0, column);
      }
    }

    // Force Angular to detect the change if OnPush is used
    this.displayedColumns = [...this.displayedColumns];
  }
}
