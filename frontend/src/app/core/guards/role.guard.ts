import { Injectable } from '@angular/core';
import {
  CanActivate,
  CanActivateChild,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Role } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate, CanActivateChild {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    const requiredRoles = route.data['roles'] as Role[];
    return this.checkRole(requiredRoles);
  }

  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.canActivate(route, state);
  }

  private checkRole(requiredRoles: Role[]): Observable<boolean> {
    return this.authService.currentUser$.pipe(
      take(1),
      map((user) => {
        if (!user) {
          this.router.navigate(['/auth/login']);
          return false;
        }

        if (!requiredRoles || requiredRoles.length === 0) {
          return true;
        }

        const hasRole = requiredRoles.includes(user.role);
        if (!hasRole) {
          // Redirect based on user role
          switch (user.role) {
            case Role.ADMIN:
              this.router.navigate(['/admin']);
              break;
            case Role.INSTRUCTOR:
              this.router.navigate(['/instructor']);
              break;
            case Role.STUDENT:
              this.router.navigate(['/dashboard']);
              break;
            default:
              this.router.navigate(['/']);
          }
          return false;
        }

        return true;
      })
    );
  }
}
