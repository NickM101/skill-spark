// src/app/features/admin/modules/user-management/components/user-list/user-list.component.ts

import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

import { UserManagementService } from '../../services/user-management.service';

import { UserFormComponent } from '../user-form/user-form';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog';
import { BulkActionRequest, Role, User, UserFilters, UserTableColumn } from '@core/models/user.model';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.html',
  styleUrls: ['./user-list.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    MatChipsModule,
    MatProgressSpinnerModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserListComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private destroy$ = new Subject<void>();

  dataSource = new MatTableDataSource<User>([]);
  selection = new SelectionModel<User>(true, []);

  filterForm: FormGroup;
  isLoading = false;
  totalCount = 0;
  pageSize = 10;
  currentPage = 1;

  // Table configuration
  displayedColumns: string[] = [
    'select',
    'fullName',
    'email',
    'role',
    'isActive',
    'isEmailVerified',
    'enrollmentCount',
    'createdAt',
    'actions',
  ];

  columns: UserTableColumn[] = [
    { key: 'fullName', label: 'Full Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'role', label: 'Role', sortable: true },
    { key: 'isActive', label: 'Status', sortable: true },
    { key: 'isEmailVerified', label: 'Verified', sortable: true },
    { key: 'enrollmentCount', label: 'Enrollments', sortable: false },
    { key: 'createdAt', label: 'Created', sortable: true },
    { key: 'actions', label: 'Actions', sortable: false, width: '120px' },
  ];

  roleOptions = [
    { value: '', label: 'All Roles' },
    { value: Role.ADMIN, label: 'Admin' },
    { value: Role.INSTRUCTOR, label: 'Instructor' },
    { value: Role.STUDENT, label: 'Student' },
  ];

  statusOptions = [
    { value: '', label: 'All Status' },
    { value: true, label: 'Active' },
    { value: false, label: 'Inactive' },
  ];

  verificationOptions = [
    { value: '', label: 'All' },
    { value: true, label: 'Verified' },
    { value: false, label: 'Unverified' },
  ];

  constructor(
    private userService: UserManagementService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    this.filterForm = this.createFilterForm();
  }

  ngOnInit(): void {
    this.setupFilters();
    this.loadUsers();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createFilterForm(): FormGroup {
    return this.fb.group({
      search: [''],
      role: [''],
      isActive: [''],
      isEmailVerified: [''],
    });
  }

  private setupFilters(): void {
    this.filterForm.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.currentPage = 1;
        this.loadUsers();
      });
  }

  loadUsers(): void {
    this.isLoading = true;
    const filters: UserFilters = this.filterForm.value;

    this.userService
      .getUsers(this.currentPage, this.pageSize, filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource.data = response.users;
          this.totalCount = response.total;
          this.isLoading = false;
          this.selection.clear();
        },
        error: (error) => {
          console.error('Error loading users:', error);
          this.snackBar.open('Error loading users', 'Close', {
            duration: 3000,
          });
          this.isLoading = false;
        },
      });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadUsers();
  }

  onSortChange(sort: Sort): void {
    // In a real app, you would send sort parameters to the API
    console.log('Sort changed:', sort);
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.currentPage = 1;
    this.loadUsers();
  }

  // Selection methods
  isAllSelected(): boolean {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle(): void {
    this.isAllSelected()
      ? this.selection.clear()
      : this.dataSource.data.forEach((row) => this.selection.select(row));
  }

  // User actions
  openCreateDialog(): void {
    const dialogRef = this.dialog.open(UserFormComponent, {
      width: '600px',
      data: { isEdit: false },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadUsers();
        this.snackBar.open('User created successfully', 'Close', {
          duration: 3000,
        });
      }
    });
  }

  editUser(user: User): void {
    const dialogRef = this.dialog.open(UserFormComponent, {
      width: '600px',
      data: { isEdit: true, user },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadUsers();
        this.snackBar.open('User updated successfully', 'Close', {
          duration: 3000,
        });
      }
    });
  }

  deleteUser(user: User): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete User',
        message: `Are you sure you want to delete ${user.fullName}?`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.userService
          .deleteUser(user.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              this.loadUsers();
              this.snackBar.open('User deleted successfully', 'Close', {
                duration: 3000,
              });
            },
            error: (error) => {
              console.error('Error deleting user:', error);
              this.snackBar.open('Error deleting user', 'Close', {
                duration: 3000,
              });
            },
          });
      }
    });
  }

  toggleUserStatus(user: User): void {
    const updateData = {
      id: user.id,
      isActive: !user.isActive,
    };

    this.userService
      .updateUser(updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadUsers();
          const status = updateData.isActive ? 'activated' : 'deactivated';
          this.snackBar.open(`User ${status} successfully`, 'Close', {
            duration: 3000,
          });
        },
        error: (error) => {
          console.error('Error updating user status:', error);
          this.snackBar.open('Error updating user status', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  verifyUser(user: User): void {
    const updateData = {
      id: user.id,
      isEmailVerified: true,
    };

    this.userService
      .updateUser(updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadUsers();
          this.snackBar.open('User verified successfully', 'Close', {
            duration: 3000,
          });
        },
        error: (error) => {
          console.error('Error verifying user:', error);
          this.snackBar.open('Error verifying user', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  // Bulk actions
  bulkActivate(): void {
    this.performBulkAction('activate', 'Users activated successfully');
  }

  bulkDeactivate(): void {
    this.performBulkAction('deactivate', 'Users deactivated successfully');
  }

  bulkVerify(): void {
    this.performBulkAction('verify', 'Users verified successfully');
  }

  bulkDelete(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Users',
        message: `Are you sure you want to delete ${this.selection.selected.length} selected users?`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.performBulkAction('delete', 'Users deleted successfully');
      }
    });
  }

  private performBulkAction(
    action: BulkActionRequest['action'],
    successMessage: string
  ): void {
    const userIds = this.selection.selected.map((user) => user.id);

    if (userIds.length === 0) {
      this.snackBar.open('No users selected', 'Close', { duration: 3000 });
      return;
    }

    this.userService
      .bulkAction({ userIds, action })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadUsers();
          this.snackBar.open(successMessage, 'Close', { duration: 3000 });
        },
        error: (error) => {
          console.error('Bulk action error:', error);
          this.snackBar.open('Error performing bulk action', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  getRoleColor(role: Role): string {
    switch (role) {
      case Role.ADMIN:
        return 'warn';
      case Role.INSTRUCTOR:
        return 'accent';
      case Role.STUDENT:
        return 'primary';
      default:
        return '';
    }
  }

  hasSelectedUsers(): boolean {
    return this.selection.selected.length > 0;
  }
}
