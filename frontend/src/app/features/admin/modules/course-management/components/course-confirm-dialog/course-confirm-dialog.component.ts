import { Component, Inject, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SharedModule } from '@shared/shared.module';
import { Course } from '@core/models/course.model';

export interface CourseConfirmDialogData {
  type: 'delete' | 'publish' | 'unpublish' | 'assign-instructor';
  course: Course;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'accent' | 'warn';
  additionalInfo?: string;
  instructorName?: string; // For assign instructor dialog
}

@Component({
  selector: 'app-course-confirm-dialog',
  templateUrl: './course-confirm-dialog.component.html',
  styleUrls: ['./course-confirm-dialog.component.scss'],
  imports: [SharedModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CourseConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<CourseConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CourseConfirmDialogData
  ) {
    this.setDefaults();
  }

  private setDefaults(): void {
    // Set default values based on dialog type
    switch (this.data.type) {
      case 'delete':
        this.data.title = this.data.title || 'Delete Course';
        this.data.message = this.data.message || this.getDeleteMessage();
        this.data.confirmText = this.data.confirmText || 'Delete Course';
        this.data.cancelText = this.data.cancelText || 'Cancel';
        this.data.confirmColor = 'warn';
        break;

      case 'publish':
        this.data.title = this.data.title || 'Publish Course';
        this.data.message = this.data.message || this.getPublishMessage();
        this.data.confirmText = this.data.confirmText || 'Publish Course';
        this.data.cancelText = this.data.cancelText || 'Cancel';
        this.data.confirmColor = 'primary';
        break;

      case 'unpublish':
        this.data.title = this.data.title || 'Unpublish Course';
        this.data.message = this.data.message || this.getUnpublishMessage();
        this.data.confirmText = this.data.confirmText || 'Unpublish Course';
        this.data.cancelText = this.data.cancelText || 'Cancel';
        this.data.confirmColor = 'warn';
        break;

      case 'assign-instructor':
        this.data.title = this.data.title || 'Assign Instructor';
        this.data.message =
          this.data.message || this.getAssignInstructorMessage();
        this.data.confirmText = this.data.confirmText || 'Assign Instructor';
        this.data.cancelText = this.data.cancelText || 'Cancel';
        this.data.confirmColor = 'primary';
        break;

      default:
        this.data.confirmText = this.data.confirmText || 'Confirm';
        this.data.cancelText = this.data.cancelText || 'Cancel';
        this.data.confirmColor = this.data.confirmColor || 'primary';
    }
  }

  private getDeleteMessage(): string {
    const enrollmentCount = this.data.course._count?.enrollments || 0;
    const lessonCount = this.data.course._count?.lessons || 0;
    const quizCount = this.data.course._count?.quizzes || 0;

    let message = `Are you sure you want to delete "${this.data.course.title}"?`;

    if (enrollmentCount > 0) {
      message += `\n\nThis course has ${enrollmentCount} enrolled student${
        enrollmentCount !== 1 ? 's' : ''
      }.`;
    }

    if (lessonCount > 0 || quizCount > 0) {
      message += `\n\nThis will also delete ${lessonCount} lesson${
        lessonCount !== 1 ? 's' : ''
      } and ${quizCount} quiz${quizCount !== 1 ? 'zes' : ''}.`;
    }

    message += '\n\nThis action cannot be undone.';

    return message;
  }

  private getPublishMessage(): string {
    let message = `Are you sure you want to publish "${this.data.course.title}"?`;

    if (!this.data.course.instructor) {
      message +=
        '\n\n⚠️ Warning: This course does not have an assigned instructor.';
    }

    if (!this.data.course.description) {
      message += '\n\n⚠️ Warning: This course does not have a description.';
    }

    const lessonCount = this.data.course._count?.lessons || 0;
    if (lessonCount === 0) {
      message += '\n\n⚠️ Warning: This course does not have any lessons.';
    }

    message +=
      '\n\nOnce published, students will be able to enroll in this course.';

    return message;
  }

  private getUnpublishMessage(): string {
    const enrollmentCount = this.data.course._count?.enrollments || 0;

    let message = `Are you sure you want to unpublish "${this.data.course.title}"?`;

    if (enrollmentCount > 0) {
      message += `\n\n⚠️ Warning: This course has ${enrollmentCount} enrolled student${
        enrollmentCount !== 1 ? 's' : ''
      }. They will lose access to the course content.`;
    }

    message +=
      '\n\nThe course will be hidden from the public catalog and no new enrollments will be accepted.';

    return message;
  }

  private getAssignInstructorMessage(): string {
    let message = `Assign "${this.data.instructorName}" as the instructor for "${this.data.course.title}"?`;

    if (this.data.course.instructor) {
      message = `Replace "${this.data.course.instructor.firstName} ${this.data.course.instructor.lastName}" with "${this.data.instructorName}" as the instructor for "${this.data.course.title}"?`;
    }

    message +=
      '\n\nThe instructor will have full access to manage this course content and track student progress.';

    return message;
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  getDialogIcon(): string {
    switch (this.data.type) {
      case 'delete':
        return 'delete_forever';
      case 'publish':
        return 'publish';
      case 'unpublish':
        return 'unpublished';
      case 'assign-instructor':
        return 'person_add';
      default:
        return 'help_outline';
    }
  }

  getIconColor(): string {
    switch (this.data.type) {
      case 'delete':
      case 'unpublish':
        return 'warn';
      case 'publish':
      case 'assign-instructor':
        return 'primary';
      default:
        return 'primary';
    }
  }

  getWarningCount(): number {
    let warnings = 0;

    if (this.data.type === 'publish') {
      if (!this.data.course.instructor) warnings++;
      if (!this.data.course.description) warnings++;
      if (!this.data.course._count?.lessons) warnings++;
    }

    return warnings;
  }

  hasWarnings(): boolean {
    return this.getWarningCount() > 0;
  }

  getCourseInfo(): { label: string; value: string | number }[] {
    const info = [
      {
        label: 'Category',
        value: this.data.course.category?.name || 'Uncategorized',
      },
      { label: 'Level', value: this.data.course.level },
      {
        label: 'Price',
        value: this.data.course.price
          ? `Ksh. ${this.data.course.price.toFixed(2)}`
          : 'Free',
      },
    ];

    if (this.data.course._count?.enrollments !== undefined) {
      info.push({
        label: 'Enrollments',
        value: String(this.data.course._count.enrollments),
      });
    }

    if (this.data.course._count?.lessons !== undefined) {
      info.push({
        label: 'Lessons',
        value: String(this.data.course._count.lessons),
      });
    }

    if (this.data.course._count?.quizzes !== undefined) {
      info.push({
        label: 'Quizzes',
        value: String(this.data.course._count.quizzes),
      });
    }

    return info;
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString();
  }

  getFormattedMessage(): string {
    return (this.data.message ?? '').replace(/\n/g, '<br>');
  }
}
