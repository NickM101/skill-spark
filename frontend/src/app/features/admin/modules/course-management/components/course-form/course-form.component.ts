// src/app/features/admin/modules/course-management/components/course-form/course-form.component.ts

import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { Category } from '@core/models/category.model';
import {
  Course,
  CourseLevel,
  CreateCourseRequest,
  UpdateCourseRequest,
} from '@core/models/course.model';
import { User } from '@core/models/user.model';
import { CourseService } from '../../services/admin-course.service';
import { SharedModule } from '@shared/shared.module';
import { LessonListComponent } from "../../../lessons/components/lesson-list/lesson-list.component";

@Component({
  selector: 'app-course-form',
  templateUrl: './course-form.component.html',
  styleUrls: ['./course-form.component.scss'],
  imports: [SharedModule, LessonListComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseFormComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Form and data
  courseForm: FormGroup;
  categories: Category[] = [];
  instructors: User[] = [];
  loading$ = this.courseService.loading$;

  lessonsCount = 0;

  // Component state
  isEditMode = false;
  courseId: string | null = null;
  currentCourse: Course | null = null;
  isSubmitting = false;
  selectedTabIndex = 0;

  // Enums for template
  readonly CourseLevels = Object.values(CourseLevel);

  constructor(
    private fb: FormBuilder,
    private courseService: CourseService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.courseForm = this.createForm();
  }

  ngOnInit(): void {
    this.initializeData();
    this.checkEditMode();
    this.setupFormValidation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      // Basic Information
      title: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(100),
        ],
      ],
      description: ['', [Validators.maxLength(1000)]],
      thumbnail: [''],

      // Course Details
      price: [null, [Validators.min(0), Validators.max(9999.99)]],
      level: [CourseLevel.BEGINNER, [Validators.required]],
      categoryId: ['', [Validators.required]],
      instructorId: ['', [Validators.required]],

      // Settings
      isPublished: [false],
    });
  }

  private setupFormValidation(): void {
    this.courseForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cdr.markForCheck();
      });
  }

  private initializeData(): void {
    combineLatest([
      this.courseService.getCategories(),
      this.courseService.loadInstructors(),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([categories, instructors]) => {
          this.categories = categories;
          this.instructors = instructors;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading form data:', error);
          this.showErrorMessage('Failed to load form data');
        },
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
    this.courseService
      .getCourse(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (course) => {
          this.currentCourse = course;
          this.populateForm(course);
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading course:', error);
          this.showErrorMessage('Failed to load course');
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
    this.courseForm.markAsPristine();
  }

  // Form submission
  onSubmit(): void {
    if (this.courseForm.invalid || this.isSubmitting) {
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting = true;
    this.cdr.markForCheck();

    const formValue = this.courseForm.value;

    if (this.isEditMode && this.courseId) {
      this.updateCourse(formValue);
    } else {
      this.createCourse(formValue);
    }
  }

  private createCourse(formValue: any): void {
    const createRequest: CreateCourseRequest = {
      title: formValue.title.trim(),
      description: formValue.description?.trim() || undefined,
      // thumbnail: formValue.thumbnail?.trim() || undefined,
      price: formValue.price || undefined,
      level: formValue.level,
      categoryId: formValue.categoryId,
      instructorId: formValue.instructorId,
      isPublished: formValue.isPublished || false,
    };

    this.courseService
      .createCourse(createRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (course) => {
          this.showSuccessMessage('Course created successfully');
          this.navigateToList();
        },
        error: (error) => {
          this.handleFormError(error);
        },
        complete: () => {
          this.isSubmitting = false;
          this.cdr.markForCheck();
        },
      });
  }

  private updateCourse(formValue: any): void {
    const updateRequest: UpdateCourseRequest = {
      title: formValue.title.trim(),
      description: formValue.description?.trim() || undefined,
      // thumbnail: formValue.thumbnail?.trim() || undefined,
      price: formValue.price || undefined,
      level: formValue.level,
      categoryId: formValue.categoryId,
      instructorId: formValue.instructorId,
      isPublished: formValue.isPublished || false,
    };

    this.courseService
      .updateCourse(this.courseId!, updateRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (course) => {
          this.currentCourse = course;
          this.showSuccessMessage('Course updated successfully');
          this.navigateToList();
        },
        error: (error) => {
          this.handleFormError(error);
        },
        complete: () => {
          this.isSubmitting = false;
          this.cdr.markForCheck();
        },
      });
  }

  private handleFormError(error: any): void {
    console.error('Form submission error:', error);
    this.showErrorMessage('An error occurred. Please try again.');
    this.isSubmitting = false;
    this.cdr.markForCheck();
  }

  private markFormGroupTouched(): void {
    Object.keys(this.courseForm.controls).forEach((key) => {
      this.courseForm.get(key)?.markAsTouched();
    });
    this.cdr.markForCheck();
  }

  // Form actions
  onReset(): void {
    if (this.isEditMode && this.currentCourse) {
      this.populateForm(this.currentCourse);
    } else {
      this.courseForm.reset({
        level: CourseLevel.BEGINNER,
        isPublished: false,
      });
    }
    this.showInfoMessage('Form reset');
  }

  onCancel(): void {
    if (this.courseForm.dirty && !this.isSubmitting) {
      if (
        confirm('You have unsaved changes. Are you sure you want to leave?')
      ) {
        this.router.navigate(['/admin/courses']);
      }
    } else {
      this.router.navigate(['/admin/courses']);
    }
  }

  onSaveDraft(): void {
    const currentPublishedState = this.courseForm.get('isPublished')?.value;
    this.courseForm.patchValue({ isPublished: false });
    this.onSubmit();

    // Restore original state if submission fails
    if (this.courseForm.invalid) {
      this.courseForm.patchValue({ isPublished: currentPublishedState });
    }
  }

  onPublish(): void {
    this.courseForm.patchValue({ isPublished: true });
    this.onSubmit();
  }

  private navigateToList(): void {
    setTimeout(() => {
      this.router.navigate(['/admin/courses']);
    }, 1500);
  }

  // Validation helper methods
  getFieldError(fieldName: string): string {
    const control = this.courseForm.get(fieldName);
    if (!control?.errors) return '';

    const errors = control.errors;

    if (errors['required'])
      return `${this.getFieldLabel(fieldName)} is required`;
    if (errors['minlength'])
      return `Minimum ${errors['minlength'].requiredLength} characters required`;
    if (errors['maxlength'])
      return `Maximum ${errors['maxlength'].requiredLength} characters allowed`;
    if (errors['min']) return `Minimum value is ${errors['min'].min}`;
    if (errors['max']) return `Maximum value is ${errors['max'].max}`;

    return 'Invalid value';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      title: 'Course title',
      description: 'Description',
      thumbnail: 'Thumbnail URL',
      price: 'Price',
      level: 'Course level',
      categoryId: 'Category',
      instructorId: 'Instructor',
    };
    return labels[fieldName] || fieldName;
  }

  hasFieldError(fieldName: string): boolean {
    const control = this.courseForm.get(fieldName);
    return !!(control?.errors && (control.touched || control.dirty));
  }

  // Template helper methods
  getPageTitle(): string {
    return this.isEditMode ? 'Edit Course' : 'Create New Course';
  }

  canShowPreview(): boolean {
    return this.isEditMode && !!this.currentCourse;
  }

  getLevelIcon(level: CourseLevel): string {
    switch (level) {
      case CourseLevel.BEGINNER:
        return 'star_border';
      case CourseLevel.INTERMEDIATE:
        return 'star_half';
      case CourseLevel.ADVANCED:
        return 'star';
      default:
        return 'star_border';
    }
  }

  onLessonsChanged(lessonsCount: number): void {
    this.lessonsCount = lessonsCount;
    this.cdr.markForCheck();
  }

  onAddLesson(): void {
    // You can implement this to open a lesson creation dialog
    // or navigate to a lesson creation route
    console.log('Add new lesson for course:', this.courseId);

    // Example implementations:
    // 1. Navigate to lesson creation route
    // this.router.navigate(['/admin/courses', this.courseId, 'lessons', 'create']);

    // 2. Open lesson creation dialog
    // this.dialog.open(LessonFormDialogComponent, {
    //   data: { courseId: this.courseId }
    // });

    // 3. Emit event to parent component
    // this.addLessonRequested.emit(this.courseId);
  }

  // Optional: Method to validate if course can be published
  canPublishCourse(): boolean {
    // Add validation logic - e.g., course must have at least one lesson
    if (this.isEditMode && this.lessonsCount === 0) {
      return false;
    }
    return this.courseForm.valid;
  }


  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString();
  }

  // Helper methods for user feedback
  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar'],
    });
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 4000,
      panelClass: ['error-snackbar'],
    });
  }

  private showInfoMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 2000,
    });
  }

  // TrackBy functions
  trackByCategory(index: number, category: Category): string {
    return category.id;
  }

  trackByInstructor(index: number, instructor: User): string {
    return instructor.id;
  }
}
