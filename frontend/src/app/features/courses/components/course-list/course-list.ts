// src/app/features/courses/components/course-list/course-list.component.ts

import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Observable, Subject, combineLatest, BehaviorSubject } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  map,
  takeUntil,
  startWith,
} from 'rxjs/operators';

import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { CourseService } from '../../services/course.service';
import {
  Course,
  Category,
  CourseFilters,
  CourseLevel,
  CourseListResponse,
} from '../../../../core/models/course.model';



import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-course-list',
  templateUrl: 'course-list.html',
  styleUrl: 'course-list.scss',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
    MatTabsModule,
    MatMenuModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule,
    MatDividerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private page$ = new BehaviorSubject<number>(1);

  filterForm!: FormGroup;
  courses$!: Observable<Course[]>;
  categories$!: Observable<Category[]>;
  loading$!: Observable<boolean>;

  courseLevels = Object.values(CourseLevel);
  pageSize = 12;
  totalCourses = 0;
  totalPages = 0;

  // View & Sort State
  viewMode: 'grid' | 'list' = 'grid';
  sortBy: 'title' | 'price' | 'level' | 'created' = 'created';
  sortDirection: 'asc' | 'desc' = 'desc';

  constructor(
    private courseService: CourseService,
    private router: Router,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.initializeObservables();
    this.setupCourseStream();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.filterForm = this.fb.group({
      search: [''],
      categoryId: [''],
      level: [''],
      minPrice: [null],
      maxPrice: [null],
    });
  }

  private initializeObservables(): void {
    this.categories$ = this.courseService.getCategories();
    this.loading$ = this.courseService.loading$;
  }

  private setupCourseStream(): void {
    this.courses$ = combineLatest([
      this.filterForm.valueChanges.pipe(
        startWith(this.filterForm.value),
        debounceTime(300),
        distinctUntilChanged()
      ),
      this.page$,
    ]).pipe(
      switchMap(([filters, page]) =>
        this.courseService.getCourses(filters, page, this.pageSize)
      ),
      map((response: CourseListResponse) => {
        console.log("Get Course", response)
        this.totalCourses = response.total;
        this.totalPages = response.totalPages;
        return this.sortCourses(response.courses);
      }),
      takeUntil(this.destroy$)
    );
  }

  // Event Handlers

  onCategoryChange(event: MatSelectChange): void {
    this.filterForm.patchValue({ categoryId: event.value });
    this.resetPage();
  }

  onLevelChange(event: MatSelectChange): void {
    this.filterForm.patchValue({ level: event.value });
    this.resetPage();
  }

  onSearchChange(term: string): void {
    this.filterForm.patchValue({ search: term });
    this.resetPage();
  }

  onPriceRangeChange(): void {
    this.resetPage();
  }

  onSortChange(field: string): void {
    if (this.sortBy === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field as typeof this.sortBy;
      this.sortDirection = 'asc';
    }
    this.resetPage();
  }

  onViewModeChange(mode: 'grid' | 'list'): void {
    this.viewMode = mode;
  }

  onPageChange(page: number): void {
    this.page$.next(page);
    this.scrollToTop();
  }

  onCourseClick(course: Course): void {
    this.router.navigate(['/courses', course.id]);
  }

  onEnrollClick(course: Course, event: Event): void {
    event.stopPropagation();
    console.log('Enrolling in course:', course.title);
    // Future: handle enrollment
  }

  clearFilters(): void {
    this.filterForm.reset({
      search: '',
      categoryId: '',
      level: '',
      minPrice: null,
      maxPrice: null,
    });
    this.resetPage();
  }

  private resetPage(): void {
    this.page$.next(1);
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Helpers

  private sortCourses(courses: Course[]): Course[] {
    const sorted = [...courses].sort((a, b) => {
      let compare = 0;

      switch (this.sortBy) {
        case 'title':
          compare = a.title.localeCompare(b.title);
          break;
        case 'price':
          compare = (a.price ?? 0) - (b.price ?? 0);
          break;
        case 'level':
          const order = { BEGINNER: 1, INTERMEDIATE: 2, ADVANCED: 3 };
          compare = order[a.level] - order[b.level];
          break;
        case 'created':
          compare =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }

      return this.sortDirection === 'asc' ? compare : -compare;
    });

    return sorted;
  }

  getCategoryName(categoryId: string): Observable<string> {
    return this.categories$.pipe(
      map(
        (categories) =>
          categories.find((c) => c.id === categoryId)?.name ?? 'Unknown'
      )
    );
  }

  getInstructorName(course: Course): string {
    return course.instructor
      ? `${course.instructor.firstName} ${course.instructor.lastName}`
      : 'Unknown Instructor';
  }

  getLevelBadgeClass(level: CourseLevel): string {
    switch (level) {
      case CourseLevel.BEGINNER:
        return 'badge-success';
      case CourseLevel.INTERMEDIATE:
        return 'badge-primary';
      case CourseLevel.ADVANCED:
        return 'badge-warn';
      default:
        return 'badge-secondary';
    }
  }

  formatPrice(price?: number): string {
    return price ? `$${price.toFixed(2)}` : 'Free';
  }

  getLessonCount(course: Course): number {
    return course.lessons?.length ?? 0;
  }

  trackByCourseId(_: number, course: Course): string {
    return course.id;
  }
}
