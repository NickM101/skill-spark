// src/app/features/admin/modules/category-management/components/category-list/category-list.component.ts

import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { Subject, combineLatest } from 'rxjs';
import {
  takeUntil,
  startWith,
  debounceTime,
  distinctUntilChanged,
} from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormControl } from '@angular/forms';

import { CategoryService } from '../../services/category.service';
import { Category, CategoryListResponse } from '@core/models/category.model';
import { CategoryFormComponent } from '../category-form/category-form.component';
import { SharedModule } from '@shared/shared.module';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-category-list',
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.scss'],
  imports: [SharedModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryListComponent implements OnInit, OnDestroy {
  categories: Category[] = [];
  loading$ = this.categoryService.loading$;

  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalCategories = 0;
  totalPages = 0;

  // Search
  searchControl = new FormControl('');

  private destroy$ = new Subject<void>();

  constructor(
    private categoryService: CategoryService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.setupSearch();
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearch(): void {
    this.searchControl.valueChanges
      .pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.currentPage = 1; // Reset to first page on search
        this.loadCategories();
      });
  }

  loadCategories(): void {
    const searchTerm = this.searchControl.value || '';

    this.categoryService
      .getCategories({
        page: this.currentPage,
        limit: this.pageSize,
        search: searchTerm.trim() || undefined,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: CategoryListResponse) => {
          this.categories = response.categories;
          this.totalCategories = response.total;
          this.totalPages =
            response?.total || Math.ceil(response.total / this.pageSize);
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.showErrorMessage('Failed to load categories');
          console.error('Error loading categories:', error);
        },
      });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadCategories();
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(CategoryFormComponent, {
      width: '500px',
      data: { mode: 'create' },
      disableClose: true,
      autoFocus: 'first-tabbable',
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result) {
          this.showSuccessMessage('Category created successfully');
          this.loadCategories(); // Refresh the list
        }
      });
  }

  openEditDialog(category: Category): void {
    const dialogRef = this.dialog.open(CategoryFormComponent, {
      width: '500px',
      data: { mode: 'edit', category: { ...category } },
      disableClose: true,
      autoFocus: 'first-tabbable',
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        if (result) {
          this.showSuccessMessage('Category updated successfully');
          this.loadCategories(); // Refresh the list
        }
      });
  }

  deleteCategory(category: Category): void {
    // Check if category has courses
    const courseCount = this.getCourseCount(category);
    if (courseCount > 0) {
      this.showErrorMessage(
        `Cannot delete category with ${courseCount} associated course${
          courseCount > 1 ? 's' : ''
        }`
      );
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Category',
        message: `Are you sure you want to delete "${category.name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        confirmColor: 'warn',
      },
      autoFocus: 'dialog',
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.performDelete(category.id);
        }
      });
  }

  private performDelete(categoryId: string): void {
    this.categoryService
      .deleteCategory(categoryId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSuccessMessage('Category deleted successfully');
          this.loadCategories(); // Refresh the list
        },
        error: (error) => {
          const errorMessage = error.message || 'Failed to delete category';
          this.showErrorMessage(errorMessage);
          console.error('Error deleting category:', error);
        },
      });
  }

  trackByCategory(index: number, category: Category): string {
    return category.id;
  }

  getCourseCount(category: Category): number {
    return category.courses?.length || 0;
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

  // Helper methods for template
  get hasCategories(): boolean {
    return this.categories.length > 0;
  }

  get isSearching(): boolean {
    return !!(this.searchControl.value && this.searchControl.value.trim());
  }

  clearSearch(): void {
    this.searchControl.setValue('');
  }

  refreshCategories(): void {
    this.loadCategories();
  }
}

// ================================================================================================
