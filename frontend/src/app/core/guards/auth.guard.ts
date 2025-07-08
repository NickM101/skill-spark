import { Injectable } from '@angular/core';
import {
  CanActivate,
  CanActivateChild,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate, CanActivateChild {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.checkAuthentication(state.url);
  }

  canActivateChild(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.canActivate(route, state);
  }

  private checkAuthentication(redirectUrl: string): Observable<boolean> {
    // Check immediate value
    const isAuthenticated = this.authService.isAuthenticated();
    if (isAuthenticated) {
      return of(true);
    }

    // Fallback if using observable-based tokens
    return this.authService.token$.pipe(
      take(1),
      map((token) => {
        const valid = !!token && this.authService.isAuthenticated();
        if (!valid) {
          this.router.navigate(['/auth/login'], {
            queryParams: { returnUrl: redirectUrl },
          });
        }
        return valid;
      })
    );
  }
}
