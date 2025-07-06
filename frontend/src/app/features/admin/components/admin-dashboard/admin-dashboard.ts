// admin-dashboard.component.ts
import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
} from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { Observable, of, Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';

// role.model.ts
export enum Role {
  ADMIN = 'ADMIN',
  INSTRUCTOR = 'INSTRUCTOR',
  STUDENT = 'STUDENT'
}
// admin-stats.model.ts
export interface AdminStats {
  totalUsers: number;
  totalStudents: number;
  totalInstructors: number;
  totalCourses: number;
  publishedCourses: number;
  totalEnrollments: number;
  totalCategories: number;
  totalQuizzes: number;
  totalRevenue: number;
  monthlyGrowth: {
    users: number;
    courses: number;
    enrollments: number;
    revenue: number;
  };
}

export interface UserStats {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  enrollmentCount: number;
  completedCourses: number;
  averageProgress: number;
  lastLoginAt: Date;
  registrationDate: Date;
  isActive: boolean;
}
export interface CourseStats {
  id: string;
  title: string;
  instructor: string;
  category: string;
  level: CourseLevel;
  enrollmentCount: number;
  completionRate: number;
  averageProgress: number;
  revenue: number;
  isPublished: boolean;
  createdAt: Date;
}
export interface EnrollmentStats {
  id: string;
  studentName: string;
  courseName: string;
  enrolledAt: Date;
  progress: number;
  status: string;
  completedAt?: Date;
}
export enum CourseLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED'
}
@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.scss'],
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatSidenavModule,
    MatMenuModule,
    MatTooltipModule,
    MatDividerModule,
    MatProgressBarModule,
    MatBadgeModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    // Other modules
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Observable data streams
  adminStats$: Observable<AdminStats | null>;

  // Loading states
  isLoadingStats = true;
  isLoadingRecentUsers = true;
  isLoadingRecentCourses = true;
  isLoadingRecentEnrollments = true;

  // Recent data
  recentUsers: UserStats[] = [];
  recentCourses: CourseStats[] = [];
  recentEnrollments: EnrollmentStats[] = [];

  // Quick actions
  quickActions = [
    {
      title: 'Add New User',
      icon: 'person_add',
      route: '/admin/users',
      action: 'create',
      color: 'primary',
    },
    {
      title: 'Review Courses',
      icon: 'rate_review',
      route: '/admin/courses',
      action: 'review',
      color: 'accent',
    },
    {
      title: 'View Analytics',
      icon: 'analytics',
      route: '/admin/analytics',
      action: 'view',
      color: 'warn',
    },
    {
      title: 'System Settings',
      icon: 'settings',
      route: '/admin/settings',
      action: 'configure',
      color: 'primary',
    },
  ];

  constructor() {
    this.adminStats$ = of(null);
  }

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDashboardData(): void {
    this.loadAdminStats();
    this.loadRecentUsers();
    this.loadRecentCourses();
    this.loadRecentEnrollments();
  }

  private loadAdminStats(): void {
    const mockStats: AdminStats = {
      totalUsers: 1500,
      totalStudents: 1200,
      totalInstructors: 300,
      totalCourses: 80,
      publishedCourses: 60,
      totalEnrollments: 2500,
      totalCategories: 10,
      totalQuizzes: 150,
      totalRevenue: 45000,
      monthlyGrowth: {
        users: 5.5,
        courses: 3.2,
        enrollments: 7.8,
        revenue: 4.9,
      },
    };

    this.adminStats$ = of(mockStats).pipe(
      finalize(() => (this.isLoadingStats = false)),
      takeUntil(this.destroy$)
    );
  }

  private loadRecentUsers(): void {
    const mockUsers: UserStats[] = [
      {
        id: '1',
        email: 'alice@example.com',
        fullName: 'Alice Johnson',
        role: Role.STUDENT,
        enrollmentCount: 5,
        completedCourses: 2,
        averageProgress: 78.5,
        lastLoginAt: new Date(),
        registrationDate: new Date('2024-12-01'),
        isActive: true,
      },
      {
        id: '2',
        email: 'bob@example.com',
        fullName: 'Bob Smith',
        role: Role.STUDENT,
        enrollmentCount: 3,
        completedCourses: 1,
        averageProgress: 65.0,
        lastLoginAt: new Date(),
        registrationDate: new Date('2025-01-15'),
        isActive: true,
      },
    ];

    of(mockUsers)
      .pipe(
        finalize(() => (this.isLoadingRecentUsers = false)),
        takeUntil(this.destroy$)
      )
      .subscribe((users) => (this.recentUsers = users));
  }

  private loadRecentCourses(): void {
    const mockCourses: CourseStats[] = [
      {
        id: 'course-1',
        title: 'Angular Basics',
        instructor: 'Jane Doe',
        category: 'Web Development',
        level: CourseLevel.BEGINNER,
        enrollmentCount: 150,
        completionRate: 85.2,
        averageProgress: 88.4,
        revenue: 3500,
        isPublished: true,
        createdAt: new Date('2025-06-01'),
      },
      {
        id: 'course-2',
        title: 'Advanced TypeScript',
        instructor: 'John Smith',
        category: 'Programming',
        level: CourseLevel.ADVANCED,
        enrollmentCount: 75,
        completionRate: 68.0,
        averageProgress: 70.1,
        revenue: 2200,
        isPublished: true,
        createdAt: new Date('2025-05-20'),
      },
    ];

    of(mockCourses)
      .pipe(
        finalize(() => (this.isLoadingRecentCourses = false)),
        takeUntil(this.destroy$)
      )
      .subscribe((courses) => (this.recentCourses = courses));
  }

  private loadRecentEnrollments(): void {
    const mockEnrollments: EnrollmentStats[] = [
      {
        id: 'enrollment-1',
        studentName: 'Alice Johnson',
        courseName: 'Angular Basics',
        enrolledAt: new Date('2025-06-02'),
        progress: 75,
        status: 'ACTIVE',
      },
      {
        id: 'enrollment-2',
        studentName: 'Bob Smith',
        courseName: 'Advanced TypeScript',
        enrolledAt: new Date('2025-06-03'),
        progress: 50,
        status: 'ACTIVE',
      },
    ];

    of(mockEnrollments)
      .pipe(
        finalize(() => (this.isLoadingRecentEnrollments = false)),
        takeUntil(this.destroy$)
      )
      .subscribe((enrollments) => (this.recentEnrollments = enrollments));
  }

  onRefreshDashboard(): void {
    this.isLoadingStats = true;
    this.isLoadingRecentUsers = true;
    this.isLoadingRecentCourses = true;
    this.isLoadingRecentEnrollments = true;
    this.loadDashboardData();
  }

  onQuickAction(action: any): void {
    // Handle quick actions
    console.log('Quick action:', action);
  }

  getGrowthIcon(growth: number): string {
    return growth > 0
      ? 'trending_up'
      : growth < 0
      ? 'trending_down'
      : 'trending_flat';
  }

  getGrowthColor(growth: number): string {
    return growth > 0 ? 'success' : growth < 0 ? 'warn' : 'accent';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }
}
