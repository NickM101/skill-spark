// src/app/features/admin/modules/user-management/services/user-management.service.ts

import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject, delay, map } from 'rxjs';

import { User, UserFilters, UserResponse, Role, CreateUserRequest, UpdateUserRequest, BulkActionRequest, UserStats } from '@core/models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserManagementService {
  private usersSubject = new BehaviorSubject<User[]>(this.getMockUsers());
  public users$ = this.usersSubject.asObservable();

  constructor() {}

  /**
   * Get users with pagination and filtering
   */
  getUsers(
    page: number = 1,
    limit: number = 10,
    filters: UserFilters = {}
  ): Observable<UserResponse> {
    return this.users$.pipe(
      delay(500), // Simulate API delay
      map((users) => {
        let filteredUsers = [...users];

        // Apply filters
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

        if (filters.isActive !== undefined && filters.isActive !== '') {
          filteredUsers = filteredUsers.filter(
            (user) => user.isActive === filters.isActive
          );
        }

        if (
          filters.isEmailVerified !== undefined &&
          filters.isEmailVerified !== ''
        ) {
          filteredUsers = filteredUsers.filter(
            (user) => user.isEmailVerified === filters.isEmailVerified
          );
        }

        // Add computed properties
        filteredUsers = filteredUsers.map((user) => ({
          ...user,
          fullName: `${user.firstName} ${user.lastName}`,
          enrollmentCount: this.getRandomNumber(0, 15),
          courseCount:
            user.role === Role.INSTRUCTOR ? this.getRandomNumber(1, 8) : 0,
        }));

        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

        return {
          users: paginatedUsers,
          total: filteredUsers.length,
          page,
          limit,
        };
      })
    );
  }

  /**
   * Get user by ID
   */
  getUserById(id: string): Observable<User | null> {
    return this.users$.pipe(
      delay(300),
      map((users) => users.find((user) => user.id === id) || null)
    );
  }

  /**
   * Create new user
   */
  createUser(userData: CreateUserRequest): Observable<User> {
    const newUser: User = {
      id: this.generateId(),
      ...userData,
      isEmailVerified: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const currentUsers = this.usersSubject.value;
    this.usersSubject.next([...currentUsers, newUser]);

    return of(newUser).pipe(delay(800));
  }

  /**
   * Update user
   */
  updateUser(userData: UpdateUserRequest): Observable<User> {
    const currentUsers = this.usersSubject.value;
    const userIndex = currentUsers.findIndex((user) => user.id === userData.id);

    if (userIndex === -1) {
      throw new Error('User not found');
    }

    const updatedUser: User = {
      ...currentUsers[userIndex],
      ...userData,
      updatedAt: new Date(),
    };

    const updatedUsers = [...currentUsers];
    updatedUsers[userIndex] = updatedUser;
    this.usersSubject.next(updatedUsers);

    return of(updatedUser).pipe(delay(600));
  }

  /**
   * Delete user
   */
  deleteUser(id: string): Observable<boolean> {
    const currentUsers = this.usersSubject.value;
    const filteredUsers = currentUsers.filter((user) => user.id !== id);
    this.usersSubject.next(filteredUsers);

    return of(true).pipe(delay(500));
  }

  /**
   * Bulk actions on users
   */
  bulkAction(request: BulkActionRequest): Observable<boolean> {
    const currentUsers = this.usersSubject.value;
    let updatedUsers = [...currentUsers];

    switch (request.action) {
      case 'activate':
        updatedUsers = updatedUsers.map((user) =>
          request.userIds.includes(user.id)
            ? { ...user, isActive: true, updatedAt: new Date() }
            : user
        );
        break;
      case 'deactivate':
        updatedUsers = updatedUsers.map((user) =>
          request.userIds.includes(user.id)
            ? { ...user, isActive: false, updatedAt: new Date() }
            : user
        );
        break;
      case 'verify':
        updatedUsers = updatedUsers.map((user) =>
          request.userIds.includes(user.id)
            ? { ...user, isEmailVerified: true, updatedAt: new Date() }
            : user
        );
        break;
      case 'delete':
        updatedUsers = updatedUsers.filter(
          (user) => !request.userIds.includes(user.id)
        );
        break;
    }

    this.usersSubject.next(updatedUsers);
    return of(true).pipe(delay(800));
  }

  /**
   * Get user statistics
   */
  getUserStats(): Observable<UserStats> {
    return this.users$.pipe(
      delay(400),
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
   * Mock data generator
   */
  private getMockUsers(): User[] {
    return [
      {
        id: '1',
        email: 'admin@learnhub.com',
        firstName: 'Admin',
        lastName: 'User',
        role: Role.ADMIN,
        isEmailVerified: true,
        isActive: true,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
      },
      {
        id: '2',
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: Role.STUDENT,
        isEmailVerified: true,
        isActive: true,
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-15'),
      },
      {
        id: '3',
        email: 'jane.smith@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: Role.INSTRUCTOR,
        isEmailVerified: true,
        isActive: true,
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-03-01'),
      },
      {
        id: '4',
        email: 'mike.wilson@example.com',
        firstName: 'Mike',
        lastName: 'Wilson',
        role: Role.STUDENT,
        isEmailVerified: false,
        isActive: true,
        createdAt: new Date('2024-03-05'),
        updatedAt: new Date('2024-03-05'),
      },
      {
        id: '5',
        email: 'sarah.connor@example.com',
        firstName: 'Sarah',
        lastName: 'Connor',
        role: Role.INSTRUCTOR,
        isEmailVerified: true,
        isActive: false,
        createdAt: new Date('2024-02-20'),
        updatedAt: new Date('2024-03-10'),
      },
      {
        id: '6',
        email: 'david.brown@example.com',
        firstName: 'David',
        lastName: 'Brown',
        role: Role.STUDENT,
        isEmailVerified: true,
        isActive: true,
        createdAt: new Date('2024-03-12'),
        updatedAt: new Date('2024-03-12'),
      },
      {
        id: '7',
        email: 'lisa.garcia@example.com',
        firstName: 'Lisa',
        lastName: 'Garcia',
        role: Role.INSTRUCTOR,
        isEmailVerified: false,
        isActive: true,
        createdAt: new Date('2024-03-08'),
        updatedAt: new Date('2024-03-08'),
      },
      {
        id: '8',
        email: 'tom.anderson@example.com',
        firstName: 'Tom',
        lastName: 'Anderson',
        role: Role.STUDENT,
        isEmailVerified: true,
        isActive: true,
        createdAt: new Date('2024-03-15'),
        updatedAt: new Date('2024-03-18'),
      },
      {
        id: '9',
        email: 'emma.jones@example.com',
        firstName: 'Emma',
        lastName: 'Jones',
        role: Role.INSTRUCTOR,
        isEmailVerified: true,
        isActive: true,
        createdAt: new Date('2024-02-28'),
        updatedAt: new Date('2024-03-20'),
      },
      {
        id: '10',
        email: 'alex.taylor@example.com',
        firstName: 'Alex',
        lastName: 'Taylor',
        role: Role.STUDENT,
        isEmailVerified: false,
        isActive: false,
        createdAt: new Date('2024-03-22'),
        updatedAt: new Date('2024-03-22'),
      },
      {
        id: '11',
        email: 'chris.lee@example.com',
        firstName: 'Chris',
        lastName: 'Lee',
        role: Role.INSTRUCTOR,
        isEmailVerified: true,
        isActive: true,
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-02-05'),
      },
      {
        id: '12',
        email: 'anna.white@example.com',
        firstName: 'Anna',
        lastName: 'White',
        role: Role.STUDENT,
        isEmailVerified: true,
        isActive: true,
        createdAt: new Date('2024-03-25'),
        updatedAt: new Date('2024-03-25'),
      },
    ];
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private getRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
