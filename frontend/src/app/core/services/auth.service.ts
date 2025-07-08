import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';
import { environment } from '../../../environments/environment';
import { User, Role } from '@core/models/user.model';
import { ApiResponse } from './api.service';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword?: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role?: Role;
}

export interface AuthResponse {
  user: User;
  token: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API_URL = `${environment.apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private tokenSubject = new BehaviorSubject<string | null>(null);
  private jwtHelper = new JwtHelperService();

  public currentUser$ = this.currentUserSubject.asObservable();
  public token$ = this.tokenSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.initializeAuth();
  }

  private initializeAuth(): void {
    const token = localStorage.getItem('accessToken');
    const user = localStorage.getItem('currentUser');

    if (token && user && !this.jwtHelper.isTokenExpired(token)) {
      this.tokenSubject.next(token);
      this.currentUserSubject.next(JSON.parse(user));
    } else {
      this.logout();
    }
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http
      .post<ApiResponse<AuthResponse>>(`${this.API_URL}/login`, credentials)
      .pipe(
        map((res) => res.data),
        tap((res: AuthResponse) => this.setSession(res)),
        catchError(this.handleError)
      );
  }

  register(data: RegisterData): Observable<AuthResponse> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.API_URL}/register`, data).pipe(
      map((res) => res.data),
      tap((res: AuthResponse) => this.setSession(res)),
      catchError(this.handleError)
    );
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http
      .post<any>(`${this.API_URL}/refresh-token`, { refreshToken })
      .pipe(
        map((res) => res.data),
        tap((res: AuthResponse) => this.setSession(res)),
        catchError((error) => {
          this.logout();
          return throwError(() => error);
        })
      );
  }

  logout(): void {
    console.log("LOGGED OUT");
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.tokenSubject.next(null);
    this.router.navigate(['/']);
  }

  changePassword(
    currentPassword: string,
    newPassword: string
  ): Observable<any> {
    return this.http
      .patch<any>(`${this.API_URL}/change-password`, {
        currentPassword,
        newPassword,
      })
      .pipe(catchError(this.handleError));
  }

  forgotPassword(email: string): Observable<any> {
    return this.http
      .post<any>(`${this.API_URL}/forgot-password`, { email })
      .pipe(catchError(this.handleError));
  }

  resetPassword(params: {token: string, password: string, confirmPassword: string}): Observable<any> {
    return this.http
      .post<any>(`${this.API_URL}/reset-password`, { token: params.token, password: params.password, confirmPassword: params.confirmPassword })
      .pipe(catchError(this.handleError));
  }

  verifyEmail(token: string): Observable<any> {
    return this.http
      .post<any>(`${this.API_URL}/verify-email`, {token})
      .pipe(catchError(this.handleError));
  }

  resendVerificationEmail(email: string): Observable<any> {
    return this.http
      .post<any>(`${this.API_URL}/resend-verification-email`, { email })
      .pipe(catchError(this.handleError));
  }

  getProfile(): Observable<User> {
    return this.http.get<any>(`${this.API_URL}/me`).pipe(
      map((res) => res.data || res),
      tap((user: User) => {
        this.currentUserSubject.next(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
      }),
      catchError(this.handleError)
    );
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    return token ? !this.jwtHelper.isTokenExpired(token) : false;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    return this.tokenSubject.value;
  }

  hasRole(role: Role): boolean {
    return this.currentUserSubject.value?.role === role;
  }

  hasAnyRole(roles: Role[]): boolean {
    return roles.includes(this.currentUserSubject.value?.role as Role);
  }

  get isAdmin(): boolean {
    return this.hasRole(Role.ADMIN);
  }

  get isInstructor(): boolean {
    return this.hasRole(Role.INSTRUCTOR);
  }

  get isStudent(): boolean {
    return this.hasRole(Role.STUDENT);
  }

  private setSession(auth: AuthResponse): void {
    localStorage.setItem('accessToken', auth.token);
    // localStorage.setItem('refreshToken', auth.refreshToken);
    localStorage.setItem('currentUser', JSON.stringify(auth.user));
    this.tokenSubject.next(auth.token);
    this.currentUserSubject.next(auth.user);
  }

  private handleError(error: any): Observable<never> {
    const message =
      error?.error?.message || error?.message || 'An unknown error occurred';
    console.error('AuthService Error:', message);
    return throwError(() => new Error(message));
  }
}
