import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Course } from '@core/models/course.model';
import { CreateEnrollmentDto } from '@core/models/enrollment.model';
import { User, Role } from '@core/models/user.model';
import {
  Subject,
  takeUntil,
  startWith,
  debounceTime,
  distinctUntilChanged,
  combineLatest,
} from 'rxjs';
import { EnrollmentService } from '../../services/enrollments.service';
import { CourseService } from '@features/admin/modules/course-management/services/admin-course.service';
import { UserManagementService } from '@features/admin/modules/user-management/services/user-management.service';
import { SharedModule } from '@shared/shared.module';

@Component({
  selector: 'app-enrollment-create',
  templateUrl: './enrollment-create.html',
  styleUrls: ['./enrollment-create.scss'],
  imports: [SharedModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnrollmentCreateComponent implements OnInit, OnDestroy {
  createForm: FormGroup;
  loading = false;
  today = new Date();

  // Data
  courses: Course[] = [];
  students: User[] = [];
  filteredCourses: Course[] = [];
  filteredStudents: User[] = [];

  // Search
  courseSearchTerm = '';
  studentSearchTerm = '';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private enrollmentService: EnrollmentService,
    private courseService: CourseService,
    private userService: UserManagementService,
    private snackBar: MatSnackBar
  ) {
    this.createForm = this.createFormGroup();
  }

  ngOnInit(): void {
    this.loadInitialData();
    this.setupFormValidation();
    this.setupSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createFormGroup(): FormGroup {
    return this.fb.group({
      studentId: ['', Validators.required],
      courseId: ['', Validators.required],
      notes: [''],
    });
  }

  private loadInitialData(): void {
    this.loading = true;

    combineLatest([
      this.courseService.getCourses({ limit: 100, isPublished: true }),
      this.userService.getUsers(),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([coursesResponse, studentsResponse]) => {
          this.courses = coursesResponse.courses;
          this.students = studentsResponse.users;
          this.filteredCourses = [...this.courses];
          this.filteredStudents = [...this.students];
          this.loading = false;
        },
        error: (error) => {
          this.loading = false;
          this.showError('Failed to load data');
          console.error('Error loading data:', error);
        },
      });
  }

  private setupFormValidation(): void {
    // Add custom validators or cross-field validation here if needed
    this.createForm
      .get('studentId')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((studentId) => {
        this.validateEnrollment(
          studentId,
          this.createForm.get('courseId')?.value
        );
      });

    this.createForm
      .get('courseId')
      ?.valueChanges.pipe(takeUntil(this.destroy$))
      .subscribe((courseId) => {
        this.validateEnrollment(
          this.createForm.get('studentId')?.value,
          courseId
        );
      });
  }

  private setupSearch(): void {
    // Course search
    this.createForm
      .get('courseSearch')
      ?.valueChanges.pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((searchTerm) => {
        this.courseSearchTerm = searchTerm || '';
        this.filterCourses();
      });

    // Student search
    this.createForm
      .get('studentSearch')
      ?.valueChanges.pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((searchTerm) => {
        this.studentSearchTerm = searchTerm || '';
        this.filterStudents();
      });
  }

  private filterCourses(): void {
    if (!this.courseSearchTerm) {
      this.filteredCourses = [...this.courses];
      return;
    }

    const searchLower = this.courseSearchTerm.toLowerCase();
    this.filteredCourses = this.courses.filter(
      (course) =>
        course.title.toLowerCase().includes(searchLower) ||
        course.description?.toLowerCase().includes(searchLower) ||
        course.category?.name.toLowerCase().includes(searchLower)
    );
  }

  private filterStudents(): void {
    if (!this.studentSearchTerm) {
      this.filteredStudents = [...this.students];
      return;
    }

    const searchLower = this.studentSearchTerm.toLowerCase();
    this.filteredStudents = this.students.filter(
      (student) =>
        `${student.firstName} ${student.lastName}`
          .toLowerCase()
          .includes(searchLower) ||
        student.email.toLowerCase().includes(searchLower)
    );
  }

  private async validateEnrollment(
    studentId: string,
    courseId: string
  ): Promise<void> {
    if (!studentId || !courseId) return;

    try {
      // Check if student is already enrolled in this course
      const existingEnrollments = await this.enrollmentService
        .getAllEnrollments({
          userId: studentId,
          courseId: courseId,
        })
        .toPromise();

      if (existingEnrollments && existingEnrollments.enrollments.length > 0) {
        this.createForm.get('courseId')?.setErrors({ alreadyEnrolled: true });
      }
    } catch (error) {
      console.error('Error validating enrollment:', error);
    }
  }

  // Event Handlers
  onSubmit(): void {
    if (!this.createForm.valid) {
      this.markFormGroupTouched();
      return;
    }

    const formValue = this.createForm.value;
    const createDto: CreateEnrollmentDto = {
      courseId: formValue.courseId,
    };

    this.loading = true;

    this.enrollmentService.createEnrollment(createDto).subscribe({
      next: (enrollment) => {
        this.loading = false;
        this.showSuccess('Enrollment created successfully');
        this.router.navigate(['/admin/enrollments', enrollment.id]);
      },
      error: (error) => {
        this.loading = false;
        this.showError('Failed to create enrollment');
        console.error('Error creating enrollment:', error);
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/admin/enrollments']);
  }

  onCourseSearch(searchTerm: string): void {
    this.courseSearchTerm = searchTerm;
    this.filterCourses();
  }

  onStudentSearch(searchTerm: string): void {
    this.studentSearchTerm = searchTerm;
    this.filterStudents();
  }

  // Utility Methods

  getSelectedStudent(): User | null {
    const studentId = this.createForm.get('studentId')?.value;
    return this.students.find((s) => s.id === studentId) || null;
  }

  getStudentDisplayName(student: User | null | undefined): string {
    if (!student) return 'Unknown Student';
    return `${student.firstName} ${student.lastName}`;
  }

  getSelectedStudentEmail(): string {
    const studentId = this.createForm.get('studentId')?.value;
    const student = this.students.find((s) => s.id === studentId);
    return student?.email || '';
  }

  getSelectedCourse(): Course | null {
    const courseId = this.createForm.get('courseId')?.value;
    return this.courses.find((c) => c.id === courseId) || null;
  }

  getSelectedCourseTitle(): string {
    return this.getSelectedCourse()?.title || '';
  }

  getSelectedCourseDescription(): string {
    return this.getSelectedCourse()?.description || '';
  }

  getSelectedCourseCategory(): string {
    return this.getSelectedCourse()?.category?.name || '';
  }

  getSelectedCourseLevel(): string {
    const course = this.getSelectedCourse();
    return course ? this.getCourseLevel(course) : '';
  }

  getSelectedCoursePrice(): string {
    const course = this.getSelectedCourse();
    return course ? this.getCoursePrice(course) : '';
  }

  getCourseDisplayName(course: Course): string {
    return `${course.title} - ${course.category?.name || 'Uncategorized'}`;
  }

  getCourseLevel(course: Course): string {
    return course.level.toLowerCase().replace('_', ' ');
  }

  getCoursePrice(course: Course): string {
    return course.price ? `$${course.price}` : 'Free';
  }

  getFormFieldError(fieldName: string): string {
    const field = this.createForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

    if (field.errors['required']) return `${fieldName} is required`;
    if (field.errors['alreadyEnrolled'])
      return 'Student is already enrolled in this course';

    return 'Invalid value';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.createForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.createForm.controls).forEach((key) => {
      const control = this.createForm.get(key);
      control?.markAsTouched();
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar'],
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
  }
}
