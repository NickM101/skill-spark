// src/app/features/lessons/components/lesson-form/lesson-form.component.ts

import {
  Component,
  Inject,
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
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { LessonService } from '../../services/lesson.service';
import {
  Lesson,
  LessonType,
  CreateLessonRequest,
  UpdateLessonRequest,
} from '@core/models/lesson.model';
import { SharedModule } from '@shared/shared.module';

export interface LessonFormData {
  mode: 'create' | 'edit';
  courseId: string;
  lesson?: Lesson;
  orderIndex?: number;
}

@Component({
  selector: 'app-lesson-form',
  templateUrl: './lesson-form.component.html',
  styleUrls: ['./lesson-form.component.scss'],
  imports: [SharedModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LessonFormComponent implements OnInit, OnDestroy {
  lessonForm: FormGroup;
  isEditMode: boolean;
  loading = false;

  // Lesson types for template
  LessonType = LessonType;
  lessonTypes = [
    { value: LessonType.TEXT, label: 'Text Content', icon: 'article' },
    { value: LessonType.VIDEO, label: 'Video', icon: 'play_circle_filled' },
    { value: LessonType.PDF, label: 'PDF Document', icon: 'picture_as_pdf' },
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private lessonService: LessonService,
    public dialogRef: MatDialogRef<LessonFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: LessonFormData,
    private cdr: ChangeDetectorRef
  ) {
    this.isEditMode = data.mode === 'edit';
    this.lessonForm = this.createForm();
  }

  ngOnInit(): void {
    this.setupFormHandling();

    if (this.isEditMode && this.data.lesson) {
      this.populateForm(this.data.lesson);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      title: ['', [Validators.required]],
      type: [LessonType.TEXT, [Validators.required]],
      content: [''],
      videoUrl: [''],
      fileUrl: [''],
      isPublished: [false],
    });
  }

  private setupFormHandling(): void {
    // Watch lesson type changes for UI updates
    this.lessonForm
      .get('type')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cdr.markForCheck();
      });

    // Watch form changes for UI updates
    this.lessonForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.cdr.markForCheck();
      });
  }

  private populateForm(lesson: Lesson): void {
    this.lessonForm.patchValue({
      title: lesson.title,
      type: lesson.type,
      content: lesson.content || '',
      videoUrl: lesson.videoUrl || '',
      fileUrl: lesson.fileUrl || '',
      isPublished: lesson.isPublished,
    });

    // Mark form as pristine after populating
    this.lessonForm.markAsPristine();
  }

  onSubmit(): void {
    if (!this.lessonForm.get('title')?.value?.trim() || this.loading) {
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    if (this.isEditMode) {
      this.updateLesson();
    } else {
      this.createLesson();
    }
  }

  private createLesson(): void {
    const formValue = this.lessonForm.value;
    const createRequest: CreateLessonRequest = {
      title: formValue.title.trim(),
      type: formValue.type,
      content: formValue.content?.trim() || undefined,
      videoUrl: formValue.videoUrl?.trim() || undefined,
      fileUrl: formValue.fileUrl?.trim() || undefined,
      orderIndex:
        this.data.orderIndex || this.lessonService.getNextOrderIndex(),
      isPublished: formValue.isPublished || false,
    };

    this.lessonService
      .createLesson(this.data.courseId, createRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (lesson) => {
          this.dialogRef.close(lesson);
        },
        error: (error) => {
          this.handleFormError(error);
        },
        complete: () => {
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  private updateLesson(): void {
    if (!this.data.lesson) return;

    const formValue = this.lessonForm.value;
    const updateRequest: UpdateLessonRequest = {
      title: formValue.title.trim(),
      type: formValue.type,
      content: formValue.content?.trim() || undefined,
      videoUrl: formValue.videoUrl?.trim() || undefined,
      fileUrl: formValue.fileUrl?.trim() || undefined,
      isPublished: formValue.isPublished,
    };

    this.lessonService
      .updateLesson(this.data.courseId, this.data.lesson.id, updateRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (lesson) => {
          this.dialogRef.close(lesson);
        },
        error: (error) => {
          this.handleFormError(error);
        },
        complete: () => {
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  private handleFormError(error: any): void {
    console.error('Form submission error:', error);
    this.loading = false;
    this.cdr.markForCheck();
  }

  onCancel(): void {
    if (this.lessonForm.dirty && !this.loading) {
      if (
        confirm('You have unsaved changes. Are you sure you want to close?')
      ) {
        this.dialogRef.close();
      }
    } else {
      this.dialogRef.close();
    }
  }

  onReset(): void {
    if (this.isEditMode && this.data.lesson) {
      this.populateForm(this.data.lesson);
    } else {
      this.lessonForm.reset({
        title: '',
        type: LessonType.TEXT,
        content: '',
        videoUrl: '',
        fileUrl: '',
        isPublished: false,
      });
    }
  }

  // Template helper methods
  getTitle(): string {
    return this.isEditMode ? 'Edit Lesson' : 'Create New Lesson';
  }

  getSubmitButtonText(): string {
    if (this.loading) {
      return this.isEditMode ? 'Updating...' : 'Creating...';
    }
    return this.isEditMode ? 'Update Lesson' : 'Create Lesson';
  }

  // Always return false to remove field validation checks
  hasFieldError(fieldName: string): boolean {
    return false;
  }

  isFieldLoading(fieldName: string): boolean {
    return false;
  }

  getFieldError(fieldName: string): string {
    return '';
  }

  shouldShowField(fieldName: string): boolean {
    const lessonType = this.lessonForm.get('type')?.value;

    switch (fieldName) {
      case 'content':
        return true;
      case 'videoUrl':
        return (
          lessonType === LessonType.VIDEO || lessonType === LessonType.TEXT
        );
      case 'fileUrl':
        return lessonType === LessonType.PDF || lessonType === LessonType.TEXT;
      default:
        return true;
    }
  }

  getFieldPlaceholder(fieldName: string): string {
    const lessonType = this.lessonForm.get('type')?.value;

    switch (fieldName) {
      case 'content':
        return lessonType === LessonType.TEXT
          ? 'Enter the lesson content'
          : 'Optional description or additional content';
      case 'videoUrl':
        return lessonType === LessonType.VIDEO
          ? 'https://example.com/video.mp4'
          : 'https://example.com/video.mp4 (optional)';
      case 'fileUrl':
        return lessonType === LessonType.PDF
          ? 'https://example.com/document.pdf'
          : 'https://example.com/document.pdf (optional)';
      default:
        return '';
    }
  }

  hasFormError(): boolean {
    return false;
  }

  getFormErrorMessage(): string {
    return '';
  }

  getLessonIcon(): string {
    const type = this.lessonForm.get('type')?.value;
    return this.lessonTypes.find((t) => t.value === type)?.icon || 'article';
  }

  getLessonLabel(): string {
    const type = this.lessonForm.get('type')?.value;
    return (
      this.lessonTypes.find((t) => t.value === type)?.label || 'Text Content'
    );
  }
}
