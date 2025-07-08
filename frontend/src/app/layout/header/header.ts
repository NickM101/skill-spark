// header.component.ts
import { Component, signal, inject, computed } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
    DatePipe,
  ],
  templateUrl: './header.html',
  styleUrls: ['./header.scss'],
})
export class HeaderComponent {
  private authService = inject(AuthService);
  private breakpointObserver = inject(BreakpointObserver);

  // Signals for reactive state management
  isMobile = signal(false);
  isLoggedIn = computed(() => this.authService.isAuthenticated());
  currentUser = computed(() => this.authService.getCurrentUser());
  notificationCount = signal(3);
  notifications = signal([
    {
      id: 1,
      message: 'New course "Angular 20 Fundamentals" is now available!',
      timestamp: new Date(),
      read: false,
    },
    {
      id: 2,
      message: 'You have completed "JavaScript Basics" course.',
      timestamp: new Date(Date.now() - 3600000),
      read: false,
    },
    {
      id: 3,
      message: 'Your enrollment in "React Development" expires in 7 days.',
      timestamp: new Date(Date.now() - 7200000),
      read: true,
    },
  ]);

  constructor() {
    // Monitor screen size changes
    this.breakpointObserver
      .observe([Breakpoints.HandsetPortrait])
      .subscribe((result) => {
        this.isMobile.set(result.matches);
      });
  }

  logout() {
    this.authService.logout();
  }

  markAllAsRead() {
    const updated = this.notifications().map((notification) => ({
      ...notification,
      read: true,
    }));
    this.notifications.set(updated);
    this.notificationCount.set(0);
  }
}
