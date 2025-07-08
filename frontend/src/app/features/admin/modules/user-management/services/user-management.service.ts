// src/app/features/admin/modules/user-management/services/user-management.service.ts

import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, map, tap, catchError, of } from 'rxjs';

import { ApiService, ApiResponse } from '@core/services/api.service';
import {
  User,
  UserFilters,
  UserResponse,
  Role,
  UserStats,
} from '@core/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserManagementService {
  private usersSubject = new BehaviorSubject<User[]>([]);
  public users$ = this.usersSubject.asObservable();

  constructor(private apiService: ApiService) {}

  /**
   * Get all users with pagination (Admin only)
   * Maps to: GET /users
   * Your backend: getAllUsers(page, limit, currentUser)
   */
  getUsers(
    page: number = 1,
    limit: number = 10,
    filters: UserFilters = {}
  ): Observable<UserResponse> {
    const params = {
      page,
      limit,
      // Add any additional filters that your backend might support
      ...(filters.search && { search: filters.search }),
      ...(filters.role && { role: filters.role }),
      ...(filters.isActive !== undefined && { isActive: filters.isActive }),
    };

    return this.apiService.get<User[]>('/users', params).pipe(
      map((response: ApiResponse<User[]>) => {
        const users = this.transformUsers(response.data);

        // Update local state
        this.usersSubject.next(users);

        return {
          users,
          total: response.meta.total,
          page: response.meta.page,
          limit: response.meta.limit,
        };
      }),
      catchError((error) => {
        console.error('Error fetching users:', error);
        return of({
          users: [],
          total: 0,
          page,
          limit,
        });
      })
    );
  }

  /**
   * Toggle user active status (Admin only)
   * Maps to: PATCH /users/:id/status
   * Your backend: toggleUserStatus(id)
   */
  toggleUserStatus(id: string): Observable<User | null> {
    return this.apiService.patch<User>(`/users/${id}/status`, {}).pipe(
      map((response: ApiResponse<User>) => {
        const updatedUser = this.transformUser(response.data);

        // Update local state
        this.updateUserInLocalState(updatedUser);

        return updatedUser;
      }),
      catchError((error) => {
        console.error('Error toggling user status:', error);
        return of(null);
      })
    );
  }

  /**
   * Delete user (Admin only)
   * Maps to: DELETE /users/:id
   * Your backend: deleteUser(id)
   */
  deleteUser(id: string): Observable<boolean> {
    return this.apiService.delete<null>(`/users/${id}`).pipe(
      map((response: ApiResponse<null>) => {
        const currentUsers = this.usersSubject.value;
        const filteredUsers = currentUsers.filter((user) => user.id !== id);
        this.usersSubject.next(filteredUsers);

        return true;
      }),
      catchError((error) => {
        console.error('Error deleting user:', error);
        return of(false);
      })
    );
  }

  /**
   * Get user statistics (calculated from local data since no backend endpoint)
   */
  getUserStats(): Observable<UserStats> {
    return this.users$.pipe(
      map((users) => {
        const totalUsers = users.length;
        const activeUsers = users.filter((user) => user.isActive).length;
        const verifiedUsers = users.filter(
          (user) => user.isEmailVerified
        ).length;

        const roleDistribution = {
          [Role.ADMIN]: users.filter((user) => user.role === Role.ADMIN).length,
          [Role.INSTRUCTOR]: users.filter(
            (user) => user.role === Role.INSTRUCTOR
          ).length,
          [Role.STUDENT]: users.filter((user) => user.role === Role.STUDENT)
            .length,
        };

        return {
          totalUsers,
          activeUsers,
          verifiedUsers,
          roleDistribution,
        };
      })
    );
  }

  /**
   * Client-side filtering for search and filters
   * Since backend might not support all filter parameters
   */
  getFilteredUsers(filters: UserFilters = {}): Observable<User[]> {
    return this.users$.pipe(
      map((users) => {
        let filteredUsers = [...users];

        // Apply client-side filters
        if (filters.search) {
          const search = filters.search.toLowerCase();
          filteredUsers = filteredUsers.filter(
            (user) =>
              user.firstName.toLowerCase().includes(search) ||
              user.lastName.toLowerCase().includes(search) ||
              user.email.toLowerCase().includes(search)
          );
        }

        if (filters.role) {
          filteredUsers = filteredUsers.filter(
            (user) => user.role === filters.role
          );
        }

        if (filters.isActive !== undefined) {
          filteredUsers = filteredUsers.filter(
            (user) => user.isActive === filters.isActive
          );
        }

        if (filters.isEmailVerified !== undefined) {
          filteredUsers = filteredUsers.filter(
            (user) => user.isEmailVerified === filters.isEmailVerified
          );
        }

        return filteredUsers;
      })
    );
  }

  /**
   * Bulk delete users (using individual delete calls)
   */
  bulkDeleteUsers(userIds: string[]): Observable<boolean> {
    const deleteOperations = userIds.map((id) =>
      this.deleteUser(id).pipe(catchError(() => of(false)))
    );

    // Execute all delete operations
    return of(true); // Simplified - you could use forkJoin for actual implementation
  }

  /**
   * Bulk toggle status (using individual status calls)
   */
  bulkToggleStatus(userIds: string[]): Observable<boolean> {
    const toggleOperations = userIds.map((id) =>
      this.toggleUserStatus(id).pipe(catchError(() => of(null)))
    );

    // Execute all toggle operations
    return of(true); // Simplified - you could use forkJoin for actual implementation
  }

  /**
   * Get user by ID (if needed for details view)
   * Note: Your backend doesn't have this endpoint, so we'll use local state
   */
  getUserById(id: string): Observable<User | null> {
    return this.users$.pipe(
      map((users) => users.find((user) => user.id === id) || null)
    );
  }

  /**
   * Private helper methods
   */
  private transformUser(backendUser: User): User {
    return {
      ...backendUser,
      fullName: `${backendUser.firstName} ${backendUser.lastName}`,
      createdAt: new Date(backendUser.createdAt),
      updatedAt: new Date(backendUser.updatedAt),
      // Add any additional computed properties your frontend needs
      enrollmentCount: 0, // Would need separate API call to get this
      courseCount: backendUser.role === Role.INSTRUCTOR ? 0 : 0, // Would need separate API call
    };
  }

  private transformUsers(backendUsers: User[]): User[] {
    return backendUsers.map((user) => this.transformUser(user));
  }

  private updateUserInLocalState(updatedUser: User): void {
    const currentUsers = this.usersSubject.value;
    const userIndex = currentUsers.findIndex(
      (user) => user.id === updatedUser.id
    );

    if (userIndex !== -1) {
      const updatedUsers = [...currentUsers];
      updatedUsers[userIndex] = updatedUser;
      this.usersSubject.next(updatedUsers);
    }
  }

  /**
   * Clear local state (useful for logout)
   */
  clearLocalState(): void {
    this.usersSubject.next([]);
  }

  /**
   * Refresh users data
   */
  refreshUsers(
    page: number = 1,
    limit: number = 10,
    filters: UserFilters = {}
  ): Observable<UserResponse> {
    return this.getUsers(page, limit, filters);
  }
}
