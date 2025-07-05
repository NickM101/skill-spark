// src/app/core/services/auth.service.ts

import { Injectable } from '@angular/core';
import {
  Observable,
  BehaviorSubject,
  of,
  delay,
  map,
  catchError,
  throwError,
} from 'rxjs';
import { User } from '../models/course.model';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'STUDENT' | 'INSTRUCTOR';
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private mockUsers: User[] = [
    {
      id: '1',
      email: 'student@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'STUDENT',
      isEmailVerified: true,
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: '2',
      email: 'instructor@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'INSTRUCTOR',
      isEmailVerified: true,
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: '3',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      isEmailVerified: true,
      isActive: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ];

  constructor() {
    // Check for stored user session
    this.initializeUserSession();
  }

  private initializeUserSession(): void {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this.currentUserSubject.next(user);
      } catch (error) {
        localStorage.removeItem('currentUser');
      }
    }
  }

  // Login
  login(credentials: LoginCredentials): Observable<User> {
    this.loadingSubject.next(true);

    return of(null).pipe(
      delay(1000), // Simulate API call
      map(() => {
        // For demo purposes, accept any password
        const user = this.mockUsers.find((u) => u.email === credentials.email);

        if (!user) {
          throw new Error('Invalid email or password');
        }

        if (!user.isActive) {
          throw new Error('Account is deactivated');
        }

        // Store user session
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);
        this.loadingSubject.next(false);

        return user;
      }),
      catchError((error) => {
        this.loadingSubject.next(false);
        return throwError(() => error);
      })
    );
  }

  // Register
  register(userData: RegisterData): Observable<User> {
    this.loadingSubject.next(true);

    return of(null).pipe(
      delay(1200), // Simulate API call
      map(() => {
        // Check if user already exists
        const existingUser = this.mockUsers.find(
          (u) => u.email === userData.email
        );
        if (existingUser) {
          throw new Error('User with this email already exists');
        }

        const newUser: User = {
          id: Date.now().toString(),
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role || 'STUDENT',
          isEmailVerified: false,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Add to mock users
        this.mockUsers.push(newUser);

        // Auto-login after registration
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        this.currentUserSubject.next(newUser);
        this.loadingSubject.next(false);

        return newUser;
      }),
      catchError((error) => {
        this.loadingSubject.next(false);
        return throwError(() => error);
      })
    );
  }

  // Logout
  logout(): Observable<boolean> {
    return of(true).pipe(
      delay(300),
      map(() => {
        localStorage.removeItem('currentUser');
        this.currentUserSubject.next(null);
        return true;
      })
    );
  }

  // Get current user
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  // Check if user is logged in
  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  // Check if user has specific role
  hasRole(role: string | string[]): boolean {
    const user = this.currentUserSubject.value;
    if (!user) return false;

    if (Array.isArray(role)) {
      return role.includes(user.role);
    }

    return user.role === role;
  }

  // Update user profile
  updateProfile(updates: Partial<User>): Observable<User> {
    this.loadingSubject.next(true);

    return of(null).pipe(
      delay(800),
      map(() => {
        const currentUser = this.currentUserSubject.value;
        if (!currentUser) {
          throw new Error('No user logged in');
        }

        const updatedUser: User = {
          ...currentUser,
          ...updates,
          updatedAt: new Date(),
        };

        // Update in mock users array
        const userIndex = this.mockUsers.findIndex(
          (u) => u.id === currentUser.id
        );
        if (userIndex !== -1) {
          this.mockUsers[userIndex] = updatedUser;
        }

        // Update session
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        this.currentUserSubject.next(updatedUser);
        this.loadingSubject.next(false);

        return updatedUser;
      }),
      catchError((error) => {
        this.loadingSubject.next(false);
        return throwError(() => error);
      })
    );
  }

  // Change password
  changePassword(
    currentPassword: string,
    newPassword: string
  ): Observable<boolean> {
    this.loadingSubject.next(true);

    return of(null).pipe(
      delay(800),
      map(() => {
        const user = this.currentUserSubject.value;
        if (!user) {
          throw new Error('No user logged in');
        }

        // In a real app, you would verify the current password
        // For demo purposes, we'll just simulate success

        this.loadingSubject.next(false);
        return true;
      }),
      catchError((error) => {
        this.loadingSubject.next(false);
        return throwError(() => error);
      })
    );
  }

  // Request password reset
  requestPasswordReset(email: string): Observable<boolean> {
    this.loadingSubject.next(true);

    return of(null).pipe(
      delay(1000),
      map(() => {
        const user = this.mockUsers.find((u) => u.email === email);
        if (!user) {
          throw new Error('No user found with this email');
        }

        // In a real app, this would send a password reset email
        this.loadingSubject.next(false);
        return true;
      }),
      catchError((error) => {
        this.loadingSubject.next(false);
        return throwError(() => error);
      })
    );
  }

  // Verify email
  verifyEmail(token: string): Observable<boolean> {
    this.loadingSubject.next(true);

    return of(null).pipe(
      delay(800),
      map(() => {
        const currentUser = this.currentUserSubject.value;
        if (!currentUser) {
          throw new Error('No user logged in');
        }

        const updatedUser: User = {
          ...currentUser,
          isEmailVerified: true,
          updatedAt: new Date(),
        };

        // Update in mock users array
        const userIndex = this.mockUsers.findIndex(
          (u) => u.id === currentUser.id
        );
        if (userIndex !== -1) {
          this.mockUsers[userIndex] = updatedUser;
        }

        // Update session
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        this.currentUserSubject.next(updatedUser);
        this.loadingSubject.next(false);

        return true;
      }),
      catchError((error) => {
        this.loadingSubject.next(false);
        return throwError(() => error);
      })
    );
  }

  // Get user by ID (for admin purposes)
  getUserById(id: string): Observable<User | null> {
    return of(null).pipe(
      delay(300),
      map(() => {
        return this.mockUsers.find((u) => u.id === id) || null;
      })
    );
  }

  // Get all users (for admin purposes)
  getAllUsers(): Observable<User[]> {
    return of(null).pipe(
      delay(500),
      map(() => {
        const currentUser = this.currentUserSubject.value;
        if (!currentUser || currentUser.role !== 'ADMIN') {
          throw new Error('Unauthorized');
        }

        return [...this.mockUsers];
      })
    );
  }
}
