import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Role } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AdminGuard implements CanActivate, CanActivateChild {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkAdminAccess();
  }

  canActivateChild(): Observable<boolean> | Promise<boolean> | boolean {
    return this.checkAdminAccess();
  }

  private checkAdminAccess(): Observable<boolean> {
    return this.authService.currentUser$.pipe(
      take(1),
      map((user) => {
        if (!user || user.role !== Role.ADMIN) {
          this.router.navigate(['/']);
          return false;
        }
        return true;
      })
    );
  }
}
