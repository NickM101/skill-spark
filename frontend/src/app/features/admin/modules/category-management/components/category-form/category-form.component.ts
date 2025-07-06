import {
  Component,
  Inject,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { CategoryService } from '../../services/category.service';
import {
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '../../../../../../core/models/category.model';
import { SharedModule } from '@shared/shared.module';

export interface CategoryFormData {
  mode: 'create' | 'edit';
  category?: Category;
}

@Component({
  selector: 'app-category-form',
  templateUrl: './category-form.component.html',
  styleUrls: ['./category-form.component.scss'],
  imports: [SharedModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryFormComponent implements OnInit, OnDestroy {
  categoryForm: FormGroup;
  isEditMode: boolean;
  loading = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private categoryService: CategoryService,
    public dialogRef: MatDialogRef<CategoryFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CategoryFormData
  ) {
    this.isEditMode = data.mode === 'edit';
    this.categoryForm = this.createForm();
  }

  ngOnInit(): void {
    if (this.isEditMode && this.data.category) {
      this.populateForm(this.data.category);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
          Validators.pattern(/^[a-zA-Z0-9\s\-_]+$/),
        ],
      ],
      description: ['', [Validators.maxLength(500)]],
    });
  }

  private populateForm(category: Category): void {
    this.categoryForm.patchValue({
      name: category.name,
      description: category.description || '',
    });
  }

  getTitle(): string {
    return this.isEditMode ? 'Edit Category' : 'Create New Category';
  }

  getSubmitButtonText(): string {
    return this.isEditMode ? 'Update Category' : 'Create Category';
  }

  onSubmit(): void {
    if (this.categoryForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    const formValue = this.categoryForm.value;

    if (this.isEditMode) {
      this.updateCategory(formValue);
    } else {
      this.createCategory(formValue);
    }
  }

  private createCategory(formValue: any): void {
    const request: CreateCategoryRequest = {
      name: formValue.name.trim(),
      description: formValue.description?.trim() || undefined,
    };

    this.categoryService
      .createCategory(request)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading = false))
      )
      .subscribe({
        next: (category: Category) => {
          this.dialogRef.close(category);
        },
        error: (error) => {
          // Handle error - could show specific validation errors
          if (error.message.includes('already exists')) {
            this.categoryForm.get('name')?.setErrors({ duplicate: true });
          } else {
            // Generic error handling
            console.error('Error updating category:', error);
          }
        },
      });
  }

  private updateCategory(formValue: any): void {
    if (!this.data.category) {
      return;
    }
    const request: UpdateCategoryRequest = {
      id: this.data.category.id,
      name: formValue.name.trim(),
      description: formValue.description?.trim() || undefined,
    };

    this.categoryService
      .updateCategory(request)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading = false))
      )
      .subscribe({
        next: (category: Category) => {
          this.dialogRef.close(category);
        },
        error: (error) => {
          if (error.message.includes('already exists')) {
            this.categoryForm.get('name')?.setErrors({ duplicate: true });
          } else {
            console.error('Error updating category:', error);
          }
        },
      });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  private markFormGroupTouched(): void {
    Object.keys(this.categoryForm.controls).forEach((key) => {
      const control = this.categoryForm.get(key);
      control?.markAsTouched();
    });
  }

  // Error message getters
  getNameErrorMessage(): string {
    const nameControl = this.categoryForm.get('name');
    if (nameControl?.hasError('required')) {
      return 'Category name is required';
    }
    if (nameControl?.hasError('minlength')) {
      return 'Category name must be at least 2 characters';
    }
    if (nameControl?.hasError('maxlength')) {
      return 'Category name cannot exceed 50 characters';
    }
    if (nameControl?.hasError('pattern')) {
      return 'Category name can only contain letters, numbers, spaces, hyphens, and underscores';
    }
    if (nameControl?.hasError('duplicate')) {
      return 'A category with this name already exists';
    }
    return '';
  }

  getDescriptionErrorMessage(): string {
    const descControl = this.categoryForm.get('description');
    if (descControl?.hasError('maxlength')) {
      return 'Description cannot exceed 500 characters';
    }
    return '';
  }
}
