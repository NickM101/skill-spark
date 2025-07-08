import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { User } from '@core/models/user.model';

interface NavigationItem {
  title: string;
  icon: string;
  route: string;
  badge?: string;
  children?: NavigationItem[];
}

interface QuickAction {
  title: string;
  icon: string;
  action: string;
}

@Component({
  selector: 'app-admin-sidebar',
  templateUrl: './admin-sidebar.html',
  styleUrls: ['./admin-sidebar.scss'],
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSidebarComponent {
  @Input() expanded: boolean = true;
  @Input() activeRoute: string = '';
  @Input() currentUser: User | null = null;
  @Input() isHandset: boolean = false;

  @Output() toggleSidebar = new EventEmitter<void>();

  // Navigation items
  navigationItems: NavigationItem[] = [
    {
      title: 'Dashboard',
      icon: 'dashboard',
      route: '/admin/dashboard',
    },
    {
      title: 'User Management',
      icon: 'people',
      route: '/admin/users',
    },
    {
      title: 'Course Management',
      icon: 'school',
      route: '/admin/courses',
    },
    {
      title: 'Categories',
      icon: 'category',
      route: '/admin/categories',
    },
    {
      title: 'Enrollments',
      icon: 'assignment',
      route: '/admin/enrollments',
    },
    {
      title: 'Quizzes',
      icon: 'quiz',
      route: '/admin/quizzes',
    },
    {
      title: 'Analytics',
      icon: 'analytics',
      route: '/admin/analytics',
    },
    {
      title: 'Settings',
      icon: 'settings',
      route: '/admin/settings',
    },
  ];

  // Quick action items
  quickActions: QuickAction[] = [
    {
      title: 'Add User',
      icon: 'person_add',
      action: 'add-user',
    },
    {
      title: 'Review Courses',
      icon: 'rate_review',
      action: 'review-courses',
    },
    {
      title: 'View Reports',
      icon: 'assessment',
      action: 'view-reports',
    },
    {
      title: 'Backup Data',
      icon: 'backup',
      action: 'backup-data',
    },
  ];

  constructor(private router: Router) {}

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  isRouteActive(route: string): boolean {
    return this.activeRoute.startsWith(route);
  }

  formatUserName(user: User): string {
    return `${user.firstName} ${user.lastName}`;
  }

  getBadgeCount(route: string): string | undefined {
    // Return badge counts for navigation items
    switch (route) {
      case '/admin/courses':
        // Could show pending courses count
        return undefined;
      case '/admin/users':
        // Could show unverified users count
        return undefined;
      default:
        return undefined;
    }
  }

  onQuickAction(action: QuickAction): void {
    switch (action.action) {
      case 'add-user':
        this.router.navigate(['/admin/users']);
        break;
      case 'review-courses':
        this.router.navigate(['/admin/courses']);
        break;
      case 'view-reports':
        this.router.navigate(['/admin/analytics']);
        break;
      case 'backup-data':
        this.performBackup();
        break;
    }
  }

  private performBackup(): void {
    console.log('Performing backup...');
    // Implementation for backup functionality
  }
}
