// src/app/features/admin/modules/course-management/components/course-list/course-list.component.ts

import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Subject, BehaviorSubject, combineLatest } from 'rxjs';
import { takeUntil, debounceTime, startWith, switchMap } from 'rxjs/operators';

import { AdminCourseService } from '../../services/admin-course.service';
import { Category } from '@core/models/category.model';
import { CourseFilters, Course, CourseStats, CourseLevel } from '@core/models/course.model';
import { User } from '@core/models/user.model';
import { CourseManagementModule } from '../../course-management';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';


@Component({
  selector: 'app-course-list',
  templateUrl: './course-list.component.html',
  styleUrls: ['./course-list.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,

    // Angular Material modules used
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatMenuModule,
    MatChipsModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatDividerModule,

    // Add RouterModule if you're using any router links (optional)
    RouterModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private filtersSubject = new BehaviorSubject<CourseFilters>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  filterForm: FormGroup;
  courses: Course[] = [];
  categories: Category[] = [];
  instructors: User[] = [];
  stats: CourseStats | null = null;
  loading$ = this.adminCourseService.loading$;

  // Pagination
  totalCourses = 0;
  pageSize = 10;
  pageIndex = 0;
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
    private adminCourseService: AdminCourseService,
    private fb: FormBuilder,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.filterForm = this.createFilterForm();
  }

  ngOnInit(): void {
    this.initializeData();
    this.setupFilterSubscription();
    this.loadCourseData();
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
    this.adminCourseService
      .getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe((categories) => {
        this.categories = categories;
      });

    // Load instructors
    this.adminCourseService
      .getInstructors()
      .pipe(takeUntil(this.destroy$))
      .subscribe((instructors) => {
        this.instructors = instructors;
      });

    // Load stats
    this.adminCourseService
      .getCourseStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe((stats) => {
        this.stats = stats;
      });
  }

  private setupFilterSubscription(): void {
    // Watch form changes and emit filter updates
    this.filterForm.valueChanges
      .pipe(
        startWith(this.filterForm.value),
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe((formValueRaw) => {
        const formValue = {
          ...formValueRaw,
          level: formValueRaw.level || undefined,
          isPublished:
            formValueRaw.isPublished === ''
              ? undefined
              : formValueRaw.isPublished,
          instructorId: formValueRaw.instructorId || undefined,
          categoryId: formValueRaw.categoryId || undefined,
        };

        const filters: CourseFilters = {
          ...this.filtersSubject.value,
          ...formValue,
          page: 1,
        };

        this.filtersSubject.next(filters);
        this.pageIndex = 0;
      });
  }

  private loadCourseData(): void {
    this.filtersSubject
      .pipe(
        switchMap((filters) => this.adminCourseService.getCourses(filters)),
        takeUntil(this.destroy$)
      )
      .subscribe((response) => {
        this.courses = response.courses;
        this.totalCourses = response.total;
      });
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;

    const filters: CourseFilters = {
      ...this.filtersSubject.value,
      page: event.pageIndex + 1,
      limit: event.pageSize,
    };

    this.filtersSubject.next(filters);
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
    const serviceCall = course.isPublished
      ? this.adminCourseService.unpublishCourse(course.id)
      : this.adminCourseService.publishCourse(course.id);

    serviceCall.pipe(takeUntil(this.destroy$)).subscribe({
      next: (updatedCourse) => {
        const index = this.courses.findIndex((c) => c.id === course.id);
        if (index >= 0) {
          this.courses[index] = updatedCourse;
        }
        this.snackBar.open(`Course ${action}ed successfully`, 'Close', {
          duration: 3000,
        });
      },
      error: (error) => {
        this.snackBar.open(`Failed to ${action} course`, 'Close', {
          duration: 3000,
        });
      },
    });
  }

  onDeleteCourse(course: Course): void {
    if (confirm(`Are you sure you want to delete "${course.title}"?`)) {
      this.adminCourseService
        .deleteCourse(course.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.courses = this.courses.filter((c) => c.id !== course.id);
            this.totalCourses--;
            this.filtersSubject.next({ ...this.filtersSubject.value });
            this.snackBar.open('Course deleted successfully', 'Close', {
              duration: 3000,
            });
          },
          error: (error) => {
            this.snackBar.open('Failed to delete course', 'Close', {
              duration: 3000,
            });
          },
        });
    }
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

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }
}
