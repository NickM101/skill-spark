import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ViewChild,
  AfterViewInit,
  ChangeDetectorRef,
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  MatPaginator,
  PageEvent,
} from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { UserManagementService } from '../../services/user-management.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog';
import {
  Role,
  User,
  UserFilters,
  UserTableColumn,
} from '@core/models/user.model';
import { SharedModule } from '@shared/shared.module';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.html',
  styleUrls: ['./user-list.scss'],
  imports: [SharedModule],
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
  allUsers: User[] = []; // Store all users for local filtering

  displayedColumns: string[] = [
    'select',
    'fullName',
    'email',
    'role',
    'isActive',
    'isEmailVerified',
    'createdAt',
    'actions',
  ];

  columns: UserTableColumn[] = [
    { key: 'fullName', label: 'Full Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'role', label: 'Role', sortable: true },
    { key: 'isActive', label: 'Status', sortable: true },
    { key: 'isEmailVerified', label: 'Verified', sortable: true },
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
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef

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
        this.applyFilters();
      });
  }

  loadUsers(): void {
    this.isLoading = true;
    this.userService
      .getUsers(this.currentPage, this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.allUsers = response.users; // Store all users
          this.totalCount = response.total;
          this.applyFilters();
          this.isLoading = false;
          this.selection.clear();
          this.cdr.detectChanges();
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

  applyFilters(): void {
    const filters: UserFilters = this.filterForm.value;
    let filteredUsers = [...this.allUsers];

    // Apply client-side filters
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filteredUsers = filteredUsers.filter(
        (user) =>
          user.firstName.toLowerCase().includes(search) ||
          user.lastName.toLowerCase().includes(search) ||
          user.email.toLowerCase().includes(search)
      );
    }

    if (filters.role) {
      filteredUsers = filteredUsers.filter(
        (user) => user.role === filters.role
      );
    }

    if (
      filters.isActive !== null &&
      filters.isActive !== undefined &&
      filters.isActive !== ''
    ) {
      filteredUsers = filteredUsers.filter(
        (user) => user.isActive === filters.isActive
      );
    }

    if (
      filters.isEmailVerified !== null &&
      filters.isEmailVerified !== undefined &&
      filters.isEmailVerified !== ''
    ) {
      filteredUsers = filteredUsers.filter(
        (user) => user.isEmailVerified === filters.isEmailVerified
      );
    }

    this.dataSource.data = filteredUsers;
    this.cdr.detectChanges(); // Manually trigger change detection
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadUsers();
  }

  onSortChange(sort: Sort): void {
    console.log('Sort changed:', sort);
    this.loadUsers();
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.currentPage = 1;
    this.loadUsers();
  }

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

  toggleUserStatus(user: User): void {
    this.userService
      .toggleUserStatus(user.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedUser) => {
          if (updatedUser) {
            const status = updatedUser.isActive ? 'activated' : 'deactivated';
            this.snackBar.open(`User ${status} successfully`, 'Close', {
              duration: 3000,
            });
            this.loadUsers();
          }
        },
        error: (error) => {
          console.error('Error updating user status:', error);
          this.snackBar.open('Error updating user status', 'Close', {
            duration: 3000,
          });
        },
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
            next: (success) => {
              if (success) {
                this.snackBar.open('User deleted successfully', 'Close', {
                  duration: 3000,
                });
                this.loadUsers();
              }
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

  bulkToggleStatus(activate: boolean): void {
    const selectedUsers = this.selection.selected;
    if (selectedUsers.length === 0) {
      this.snackBar.open('No users selected', 'Close', { duration: 3000 });
      return;
    }

    const action = activate ? 'activate' : 'deactivate';
    const message = `Are you sure you want to ${action} ${selectedUsers.length} selected users?`;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: `${activate ? 'Activate' : 'Deactivate'} Users`,
        message,
        confirmText: activate ? 'Activate' : 'Deactivate',
        cancelText: 'Cancel',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const usersToToggle = selectedUsers.filter(
          (user) => user.isActive !== activate
        );

        if (usersToToggle.length === 0) {
          this.snackBar.open(
            `All selected users are already ${
              activate ? 'active' : 'inactive'
            }`,
            'Close',
            {
              duration: 3000,
            }
          );
          return;
        }

        this.performBulkStatusToggle(usersToToggle);
      }
    });
  }

  bulkDelete(): void {
    const selectedUsers = this.selection.selected;
    if (selectedUsers.length === 0) {
      this.snackBar.open('No users selected', 'Close', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Users',
        message: `Are you sure you want to delete ${selectedUsers.length} selected users?`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.performBulkDelete(selectedUsers);
      }
    });
  }

  private performBulkStatusToggle(users: User[]): void {
    let completed = 0;
    let errors = 0;

    users.forEach((user) => {
      this.userService
        .toggleUserStatus(user.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            completed++;
            this.checkBulkOperationComplete(
              completed,
              errors,
              users.length,
              'status updated'
            );
          },
          error: () => {
            errors++;
            this.checkBulkOperationComplete(
              completed,
              errors,
              users.length,
              'status updated'
            );
          },
        });
    });
  }

  private performBulkDelete(users: User[]): void {
    let completed = 0;
    let errors = 0;

    users.forEach((user) => {
      this.userService
        .deleteUser(user.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            completed++;
            this.checkBulkOperationComplete(
              completed,
              errors,
              users.length,
              'deleted'
            );
          },
          error: () => {
            errors++;
            this.checkBulkOperationComplete(
              completed,
              errors,
              users.length,
              'deleted'
            );
          },
        });
    });
  }

  private checkBulkOperationComplete(
    completed: number,
    errors: number,
    total: number,
    operation: string
  ): void {
    if (completed + errors === total) {
      if (errors === 0) {
        this.snackBar.open(`All users ${operation} successfully`, 'Close', {
          duration: 3000,
        });
      } else if (completed === 0) {
        this.snackBar.open(`Error: No users could be ${operation}`, 'Close', {
          duration: 3000,
        });
      } else {
        this.snackBar.open(
          `${completed} users ${operation}, ${errors} failed`,
          'Close',
          { duration: 5000 }
        );
      }

      this.loadUsers();
      this.selection.clear();
    }
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
