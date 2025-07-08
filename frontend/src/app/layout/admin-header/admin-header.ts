// File: src/app/features/admin/components/admin-header/admin-header.component.ts

import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { User } from '@core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-header',
  templateUrl: './admin-header.html',
  styleUrls: ['./admin-header.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminHeaderComponent {
  @Input() pageTitle: string = 'Dashboard';
  @Input() currentUser: User | null = null;
  @Input() isHandset: boolean = false;
  private authService = inject(AuthService);
 

  @Output() menuClick = new EventEmitter<void>();
  @Output() searchSubmit = new EventEmitter<string>();
  @Output() notificationsClick = new EventEmitter<void>();
  @Output() userMenuAction = new EventEmitter<string>();
  // constructor(
  //   private cdr: ChangeDetectorRef,
  //   private router: Router
  // ) {}
  // Search input value
  searchValue: string = '';

  onMenuClick(): void {
    this.menuClick.emit();
  }

  onSearchKeyUp(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.onSearchSubmit();
    }
  }

  onSearchSubmit(): void {
    if (this.searchValue.trim()) {
      this.searchSubmit.emit(this.searchValue.trim());
    }
  }

  onNotificationsClick(): void {
    this.notificationsClick.emit();
  }

  onProfile(): void {
    this.userMenuAction.emit('profile');
  }

  onSettings(): void {
    this.userMenuAction.emit('settings');
  }

  logout() {
    this.authService.logout();
  }

  formatUserName(user: User): string {
    return `${user.firstName} ${user.lastName}`;
  }
}
