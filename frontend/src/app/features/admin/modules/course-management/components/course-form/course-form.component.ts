// src/app/features/admin/modules/course-management/components/course-form/course-form.component.ts

import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AdminCourseService } from '../../services/admin-course.service';
import { Category } from '@core/models/category.model';
import { Course, CourseLevel } from '@core/models/course.model';
import { User } from '@core/models/user.model';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-course-form',
  templateUrl: './course-form.component.html',
  styleUrls: ['./course-form.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,

    // Angular Material Modules
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseFormComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  courseForm: FormGroup;
  categories: Category[] = [];
  instructors: User[] = [];
  loading$ = this.adminCourseService.loading$;

  isEditMode = false;
  courseId: string | null = null;
  currentCourse: Course | null = null;

  // Enums for template
  CourseLevels = Object.values(CourseLevel);

  constructor(
    private fb: FormBuilder,
    private adminCourseService: AdminCourseService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.courseForm = this.createForm();
  }

  ngOnInit(): void {
    this.initializeData();
    this.checkEditMode();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      title: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(100),
        ],
      ],
      description: ['', [Validators.maxLength(1000)]],
      thumbnail: ['', [Validators.pattern(/^https?:\/\/.+/)]],
      price: [null, [Validators.min(0), Validators.max(999.99)]],
      level: [CourseLevel.BEGINNER, [Validators.required]],
      categoryId: ['', [Validators.required]],
      instructorId: ['', [Validators.required]],
      isPublished: [false],
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
  }

  private checkEditMode(): void {
    this.courseId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.courseId;

    if (this.isEditMode && this.courseId) {
      this.loadCourse(this.courseId);
    }
  }

  private loadCourse(id: string): void {
    this.adminCourseService
      .getCourse(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (course) => {
          this.currentCourse = course;
          this.populateForm(course);
        },
        error: (error) => {
          this.snackBar.open('Failed to load course', 'Close', {
            duration: 3000,
          });
          this.router.navigate(['/admin/courses']);
        },
      });
  }

  private populateForm(course: Course): void {
    this.courseForm.patchValue({
      title: course.title,
      description: course.description || '',
      thumbnail: course.thumbnail || '',
      price: course.price,
      level: course.level,
      categoryId: course.categoryId,
      instructorId: course.instructorId,
      isPublished: course.isPublished,
    });
  }

  onSubmit(): void {
    if (this.courseForm.invalid) return;

    const formValue = this.courseForm.value;

    const courseData = {
      ...formValue,
      description: formValue.description || null,
      thumbnail: formValue.thumbnail || null,
      price: formValue.price || null,
    };

    if (this.isEditMode && this.courseId) {
      this.adminCourseService
        .updateCourse(this.courseId, courseData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.snackBar.open('Course updated successfully', 'Close', {
              duration: 3000,
            });
            this.router.navigate(['/admin/courses']);
          },
          error: () => {
            this.snackBar.open('Failed to update course', 'Close', {
              duration: 3000,
            });
          },
        });
    } else {
      this.adminCourseService
        .createCourse(courseData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.snackBar.open('Course created successfully', 'Close', {
              duration: 3000,
            });
            this.router.navigate(['/admin/courses']);
          },
          error: () => {
            this.snackBar.open('Failed to create course', 'Close', {
              duration: 3000,
            });
          },
        });
    }
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      title: 'Title',
      description: 'Description',
      thumbnail: 'Thumbnail URL',
      price: 'Price',
      level: 'Level',
      categoryId: 'Category',
      instructorId: 'Instructor',
    };
    return labels[fieldName] || fieldName;
  }

  getFieldError(fieldName: string): string {
    const control = this.courseForm.get(fieldName);
    if (!control || !control.errors) return '';

    if (control.errors['required']) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    if (control.errors['minlength']) {
      return `${this.getFieldLabel(fieldName)} must be at least ${
        control.errors['minlength'].requiredLength
      } characters`;
    }
    if (control.errors['maxlength']) {
      return `${this.getFieldLabel(fieldName)} must not exceed ${
        control.errors['maxlength'].requiredLength
      } characters`;
    }
    if (control.errors['min']) {
      return `${this.getFieldLabel(fieldName)} must be at least ${
        control.errors['min'].min
      }`;
    }
    if (control.errors['max']) {
      return `${this.getFieldLabel(fieldName)} must not exceed ${
        control.errors['max'].max
      }`;
    }
    if (control.errors['pattern']) {
      return `${this.getFieldLabel(fieldName)} format is invalid`;
    }

    return 'Invalid value';
  }

  onReset(): void {
    this.courseForm.reset({
      title: '',
      description: '',
      thumbnail: '',
      price: null,
      level: CourseLevel.BEGINNER,
      categoryId: '',
      instructorId: '',
      isPublished: false,
    });

    // If editing, re-populate with original course
    if (this.isEditMode && this.currentCourse) {
      this.populateForm(this.currentCourse);
    }
  }

  onCancel(): void {
    this.router.navigate(['/admin/courses']);
  }

  hasFieldError(fieldName: string): boolean {
    const control = this.courseForm.get(fieldName);
    return !!(control?.errors && control.touched);
  }

  getPageTitle(): string {
    return this.isEditMode ? 'Edit Course' : 'Create New Course';
  }

  getSubmitButtonText(): string {
    return this.isEditMode ? 'Update Course' : 'Create Course';
  }
} 