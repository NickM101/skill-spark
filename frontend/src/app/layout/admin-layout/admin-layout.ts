import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ViewChild,
} from '@angular/core';
import {
  Router,
  NavigationEnd,
  ActivatedRoute,
  RouterModule,
} from '@angular/router';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import {
  BreakpointObserver,
  Breakpoints,
  LayoutModule,
} from '@angular/cdk/layout';
import { Observable, Subject } from 'rxjs';
import { map, shareReplay, takeUntil, filter } from 'rxjs/operators';
import { AuthService } from '@core/services/auth.service';
import { CommonModule } from '@angular/common';
import { User } from '@core/models/user.model';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar';
import { AdminHeaderComponent } from '../admin-header/admin-header';
import { AdminFooterComponent } from '../admin-footer/admin-footer';

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.html',
  styleUrls: ['./admin-layout.scss'],
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    LayoutModule,
    AdminSidebarComponent,
    AdminHeaderComponent,
    AdminFooterComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  @ViewChild('drawer') drawer!: MatSidenav;

  // Responsive breakpoints
  isHandset$: Observable<boolean> = this.breakpointObserver
    .observe(Breakpoints.Handset)
    .pipe(
      map((result) => result.matches),
      shareReplay()
    );

  // User data
  currentUser$: Observable<User | null>;

  // Navigation state
  activeRoute: string = '';
  pageTitle: string = 'Dashboard';

  // Sidebar state
  sidebarExpanded: boolean = true;

  constructor(
    private breakpointObserver: BreakpointObserver,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  ngOnInit(): void {
    this.setupRouteTracking();

    // Auto-collapse sidebar on mobile
    this.isHandset$.pipe(takeUntil(this.destroy$)).subscribe((isHandset) => {
      if (isHandset) {
        this.sidebarExpanded = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupRouteTracking(): void {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        this.activeRoute = event.url;
        this.updatePageTitle();

        // Auto-close mobile sidebar after navigation
        this.isHandset$
          .pipe(takeUntil(this.destroy$))
          .subscribe((isHandset) => {
            if (isHandset && this.drawer) {
              this.drawer.close();
            }
          });
      });
  }

  private updatePageTitle(): void {
    // This could be moved to a service or shared utility
    const titleMap: { [key: string]: string } = {
      '/admin/dashboard': 'Dashboard',
      '/admin/users': 'User Management',
      '/admin/courses': 'Course Management',
      '/admin/categories': 'Categories',
      '/admin/enrollments': 'Enrollments',
      '/admin/quizzes': 'Quizzes',
      '/admin/analytics': 'Analytics',
      '/admin/settings': 'Settings',
    };

    const foundRoute = Object.keys(titleMap).find((route) =>
      this.activeRoute.startsWith(route)
    );
    this.pageTitle = foundRoute ? titleMap[foundRoute] : 'Admin Panel';
  }

  // Sidebar methods
  onSidebarToggle(): void {
    this.sidebarExpanded = !this.sidebarExpanded;
  }

  onSidebarBackdropClick(): void {
    if (this.drawer) {
      this.drawer.close();
    }
  }

  // Header methods
  onMenuClick(): void {
    if (this.drawer) {
      this.drawer.toggle();
    }
  }

  onSearchSubmit(query: string): void {
    if (query.trim()) {
      this.router.navigate(['/admin/search'], {
        queryParams: { q: query.trim() },
      });
    }
  }

  onNotificationsClick(): void {
    console.log('Notifications clicked');
    // Handle notifications logic
  }

  onUserMenuAction(action: string): void {
    switch (action) {
      case 'profile':
        this.router.navigate(['/profile']);
        break;
      case 'settings':
        this.router.navigate(['/admin/settings']);
        break;
      case 'logout':
        this.authService.logout().subscribe(() => {
          this.router.navigate(['/auth/login']);
        });
        break;
    }
  }
}
