// src/app/features/admin/modules/user-management/components/user-form/user-form.component.ts

import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';

import { UserManagementService } from '../../services/user-management.service';
import { User, Role, CreateUserRequest, UpdateUserRequest } from '@core/models/user.model';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule, MatError } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';


interface DialogData {
  isEdit: boolean;
  user?: User;
}

interface UserFormModel {
  firstName: FormControl<string>;
  lastName: FormControl<string>;
  email: FormControl<string>;
  role: FormControl<Role>;
  isActive: FormControl<boolean>;
  isEmailVerified: FormControl<boolean>;
  password?: FormControl<string>;
  confirmPassword?: FormControl<string>;
}

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.html',
  styleUrls: ['./user-form.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatOptionModule,
    MatSlideToggleModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatError, // optional if not already included via FormField
  ],
})
export class UserFormComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  userForm: FormGroup;
  isSubmitting = false;
  isEdit: boolean;
  dialogTitle: string;

  roleOptions = [
    { value: Role.ADMIN, label: 'Admin' },
    { value: Role.INSTRUCTOR, label: 'Instructor' },
    { value: Role.STUDENT, label: 'Student' },
  ];

  constructor(
    private fb: FormBuilder,
    private userService: UserManagementService,
    private dialogRef: MatDialogRef<UserFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.isEdit = data.isEdit;
    this.dialogTitle = this.isEdit ? 'Edit User' : 'Create New User';
    this.userForm = this.createForm();
  }

  ngOnInit(): void {
    if (this.isEdit && this.data.user) {
      this.populateForm(this.data.user);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup<UserFormModel> {
    const controls: Partial<UserFormModel> = {
      firstName: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(2)],
      }),
      lastName: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(2)],
      }),
      email: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email],
      }),
      role: new FormControl(Role.STUDENT, {
        nonNullable: true,
        validators: [Validators.required],
      }),
      isActive: new FormControl(true, { nonNullable: true }),
      isEmailVerified: new FormControl(false, { nonNullable: true }),
    };

    if (!this.isEdit) {
      controls.password = new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(6)],
      });
      controls.confirmPassword = new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      });
    }
    return new FormGroup(controls as UserFormModel, {
      validators: this.passwordMatchValidator as ValidatorFn,
    });
  }

  private populateForm(user: User): void {
    this.userForm.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
    });
  }

  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (
      password &&
      confirmPassword &&
      password.value !== confirmPassword.value
    ) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    return null;
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting = true;
    const formValue = this.userForm.value;

    if (this.isEdit) {
      this.updateUser(formValue);
    } else {
      this.createUser(formValue);
    }
  }

  private createUser(formValue: any): void {
    const createRequest: CreateUserRequest = {
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email,
      role: formValue.role,
      password: formValue.password,
    };

    this.userService
      .createUser(createRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          this.dialogRef.close(user);
        },
        error: (error) => {
          console.error('Error creating user:', error);
          this.isSubmitting = false;
          // Handle error (show message to user)
        },
      });
  }

  private updateUser(formValue: any): void {
    if (!this.data.user) return;

    const updateRequest: UpdateUserRequest = {
      id: this.data.user.id,
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      email: formValue.email,
      role: formValue.role,
      isActive: formValue.isActive,
      isEmailVerified: formValue.isEmailVerified,
    };

    this.userService
      .updateUser(updateRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          this.dialogRef.close(user);
        },
        error: (error) => {
          console.error('Error updating user:', error);
          this.isSubmitting = false;
          // Handle error (show message to user)
        },
      });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.userForm.controls).forEach((key) => {
      const control = this.userForm.get(key);
      control?.markAsTouched();
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  getFieldError(fieldName: string): string {
    const field = this.userForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (field.errors['minlength']) {
        const minLength = field.errors['minlength'].requiredLength;
        return `${this.getFieldLabel(
          fieldName
        )} must be at least ${minLength} characters`;
      }
      if (field.errors['passwordMismatch']) {
        return 'Passwords do not match';
      }
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      firstName: 'First name',
      lastName: 'Last name',
      email: 'Email',
      role: 'Role',
      password: 'Password',
      confirmPassword: 'Confirm password',
    };
    return labels[fieldName] || fieldName;
  }

  hasFieldError(fieldName: string): boolean {
    const field = this.userForm.get(fieldName);
    return !!(field?.errors && field.touched);
  }

  getUserRoleLabel(): string {
    const role = this.userForm.get('role')?.value;
    const roleOption = this.roleOptions.find((option) => option.value === role);
    return roleOption ? roleOption.label : '';
  }

  getUserRoleDescription(): string {
    const role = this.userForm.get('role')?.value;
    const descriptions: { [key: string]: string } = {
      [Role.ADMIN]:
        'Full system access including user management, course moderation, and platform administration.',
      [Role.INSTRUCTOR]:
        'Can create and manage courses, view student progress, and access instructor tools.',
      [Role.STUDENT]:
        'Can enroll in courses, track progress, take quizzes, and access learning materials.',
    };
    return descriptions[role] || '';
  }
}
