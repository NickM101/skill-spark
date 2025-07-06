import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
} from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { CategoryService } from '../../services/category.service';
import { Category } from '@core/models/category.model';
import { CategoryFormComponent } from '../category-form/category-form.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { SharedModule } from '@shared/shared.module';

@Component({
  selector: 'app-category-list',
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.scss'],
  imports: [SharedModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryListComponent implements OnInit, OnDestroy {
  categories$ = this.categoryService.categories$;
  loading$ = new BehaviorSubject<boolean>(false);
  private destroy$ = new Subject<void>();

  constructor(
    private categoryService: CategoryService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCategories(): void {
    this.loading$.next(true);

    this.categoryService
      .getCategories()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.loading$.next(false))
      )
      .subscribe({
        next: () => {
          // Data is already updated via BehaviorSubject
        },
        error: () => {
          this.snackBar.open('Failed to load categories', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
          });
        },
      });
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
      .subscribe((created) => {
        if (created) {
          this.snackBar.open('Category created successfully', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
          });
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
      .subscribe((updated) => {
        if (updated) {
          this.snackBar.open('Category updated successfully', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
          });
        }
      });
  }

  deleteCategory(category: Category): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Category',
        message: `Are you sure you want to delete "${category.name}"? This cannot be undone.`,
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
          this.snackBar.open('Category deleted successfully', 'Close', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
          });
        },
        error: (error) => {
          this.snackBar.open(
            error.message || 'Failed to delete category',
            'Close',
            {
              duration: 4000,
              horizontalPosition: 'end',
              verticalPosition: 'top',
            }
          );
        },
      });
  }

  trackByCategory(index: number, category: Category): string {
    return category.id;
  }

  getCourseCount(category: Category): number {
    return category.courses?.length || 0;
  }
}
