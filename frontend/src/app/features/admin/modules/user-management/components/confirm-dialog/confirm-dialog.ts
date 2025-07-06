// src/app/features/admin/modules/user-management/components/confirm-dialog/confirm-dialog.component.ts

import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info';
}

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.html',
  styleUrls: ['./confirm-dialog.scss'],
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
})
export class ConfirmDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {
    // Set default values
    this.data = {
      title: data.title || 'Confirm Action',
      message: data.message || 'Are you sure you want to proceed?',
      confirmText: data.confirmText || 'Confirm',
      cancelText: data.cancelText || 'Cancel',
      type: data.type || 'warning',
    };
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  getIcon(): string {
    switch (this.data.type) {
      case 'danger':
        return 'warning';
      case 'info':
        return 'info';
      case 'warning':
      default:
        return 'help';
    }
  }

  getIconColor(): string {
    switch (this.data.type) {
      case 'danger':
        return 'warn';
      case 'info':
        return 'primary';
      case 'warning':
      default:
        return 'accent';
    }
  }

  getConfirmButtonColor(): string {
    switch (this.data.type) {
      case 'danger':
        return 'warn';
      case 'info':
        return 'primary';
      case 'warning':
      default:
        return 'primary';
    }
  }
}
