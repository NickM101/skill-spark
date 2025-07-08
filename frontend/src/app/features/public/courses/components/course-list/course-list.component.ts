// src/app/features/public/courses/components/course-list/course-list.component.ts

import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, Observable, combineLatest } from 'rxjs';
import {
  takeUntil,
  debounceTime,
  distinctUntilChanged,
  startWith,
} from 'rxjs/operators';
import { PageEvent } from '@angular/material/paginator';

import { CourseService } from '../../services/course.service';
import { SharedModule } from '@shared/shared.module';
import { Category } from '@core/models/category.model';
import { Course, CourseLevel, CourseResponse, CourseFilters, CourseListResponse } from '@core/models/course.model';
import { CourseCardComponent } from "../course-card/course-card.component";
import { EnrollmentService } from '../../services/enrollment.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-course-list',
  templateUrl: './course-list.component.html',
  styleUrls: ['./course-list.component.scss'],
  imports: [SharedModule, CourseCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  courses: Course[] = [];
  categories: Category[] = [];
  isLoading = false;

  // Pagination
  totalCourses = 0;
  currentPage = 1;
  pageSize = 12;
  pageSizeOptions = [6, 12, 24, 48];

  // View options
  viewMode: 'grid' | 'list' = 'grid';

  // Filter form
  filterForm: FormGroup;

  // Course levels for dropdown
  courseLevels = Object.values(CourseLevel);

  // Sort options
  sortOptions = [
    {
      value: 'title-asc',
      label: 'Title (A-Z)',
      sortBy: 'title',
      sortOrder: 'asc',
    },
    {
      value: 'title-desc',
      label: 'Title (Z-A)',
      sortBy: 'title',
      sortOrder: 'desc',
    },
    {
      value: 'price-asc',
      label: 'Price (Low to High)',
      sortBy: 'price',
      sortOrder: 'asc',
    },
    {
      value: 'price-desc',
      label: 'Price (High to Low)',
      sortBy: 'price',
      sortOrder: 'desc',
    },
    {
      value: 'newest',
      label: 'Newest First',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    },
    {
      value: 'oldest',
      label: 'Oldest First',
      sortBy: 'createdAt',
      sortOrder: 'asc',
    },
  ];

  constructor(
    private courseService: CourseService,
    private formBuilder: FormBuilder,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private enrollmentService: EnrollmentService,
    private snackBar: MatSnackBar
  ) {
    this.filterForm = this.createFilterForm();
  }

  ngOnInit(): void {
    this.loadCategories();
    this.setupFilterSubscription();
    this.loadCourses();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createFilterForm(): FormGroup {
    return this.formBuilder.group({
      search: [''],
      categoryId: [''],
      level: [''],
      sortBy: ['newest'],
      minPrice: [''],
      maxPrice: [''],
    });
  }

  private setupFilterSubscription(): void {
    this.filterForm.valueChanges
      .pipe(
        startWith(this.filterForm.value),
        debounceTime(300),
        distinctUntilChanged(
          (prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)
        ),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.currentPage = 1;
        this.loadCourses();
      });
  }

  private loadCategories(): void {
    this.courseService
      .getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe((categories: Category[]) => {
        this.categories = categories;
        this.cdr.markForCheck();
      });
  }

  private loadCourses(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    const filters = this.buildFilters();

    this.courseService
      .getCourses(filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: CourseListResponse) => {
          this.courses = response.courses;
          this.totalCourses = response.total;
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading courses:', error);
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  private buildFilters(): CourseFilters {
    const formValue = this.filterForm.value;
    const selectedSort = this.sortOptions.find(
      (option) => option.value === formValue.sortBy
    );

    return {
      search: formValue.search || undefined,
      categoryId: formValue.categoryId || undefined,
      level: formValue.level || undefined,
      minPrice: formValue.minPrice ? parseFloat(formValue.minPrice) : undefined,
      maxPrice: formValue.maxPrice ? parseFloat(formValue.maxPrice) : undefined,
      page: this.currentPage,
      limit: this.pageSize,
      sortBy: selectedSort?.sortBy as any,
      sortOrder: selectedSort?.sortOrder as any,
    };
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadCourses();
  }

  onViewModeChange(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
  }

  onCourseClick(course: Course): void {
    this.router.navigate(['/courses', course.id]);
  }

  onEnrollClick(course: Course): void {
    // Handle enrollment logic
    console.log('Enroll in course:', course.title);
    this.enrollmentService.create({courseId: course.id}).subscribe({
      next: (response) => {
        this.snackBar.open('Enrolled successfully!', 'Close', {
          duration: 3000,
        });
        // Optionally, update the course list or navigate to a different page
      },
      error: (error) => {
        this.snackBar.open('Failed to enroll: ' + error.message, 'Close', {
          duration: 3000,
        });
      },
    });    // This would typically navigate to enrollment page or open a modal
  }

  onContinueClick(course: Course): void {
    // Handle continue learning logic
    console.log('Continue course:', course.title);
    // This would typically navigate to the course content or last lesson
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.filterForm.patchValue({
      search: '',
      categoryId: '',
      level: '',
      sortBy: 'newest',
      minPrice: '',
      maxPrice: '',
    });
  }

  getCategoryName(categoryId: string): string {
    const category = this.categories.find((cat) => cat.id === categoryId);
    return category?.name || 'Unknown Category';
  }

  getLevelDisplayName(level: CourseLevel): string {
    switch (level) {
      case CourseLevel.BEGINNER:
        return 'Beginner';
      case CourseLevel.INTERMEDIATE:
        return 'Intermediate';
      case CourseLevel.ADVANCED:
        return 'Advanced';
      default:
        return 'Unknown';
    }
  }

  trackByCourseId(index: number, course: Course): string {
    return course.id;
  }

  // Helper method to check if any filters are applied
  hasActiveFilters(): boolean {
    const formValue = this.filterForm.value;
    return !!(
      formValue.search ||
      formValue.categoryId ||
      formValue.level ||
      formValue.minPrice ||
      formValue.maxPrice ||
      formValue.sortBy !== 'newest'
    );
  }

  getActiveFiltersCount(): number {
    const formValue = this.filterForm.value;
    let count = 0;

    if (formValue.search) count++;
    if (formValue.categoryId) count++;
    if (formValue.level) count++;
    if (formValue.minPrice) count++;
    if (formValue.maxPrice) count++;
    if (formValue.sortBy !== 'newest') count++;

    return count;
  }
}
