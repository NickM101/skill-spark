// user.service.ts
import { Injectable } from '@angular/core';
import { User, Role } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private users: User[] = [
    {
      id: '1',
      email: 'admin@example.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: Role.ADMIN,
      isEmailVerified: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      email: 'instructor@example.com',
      password: 'instructor123',
      firstName: 'Instructor',
      lastName: 'User',
      role: Role.INSTRUCTOR,
      isEmailVerified: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '3',
      email: 'student@example.com',
      password: 'student123',
      firstName: 'Student',
      lastName: 'User',
      role: Role.STUDENT,
      isEmailVerified: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  getUsers(): User[] {
    return this.users;
  }

  getUserById(id: string): User | undefined {
    return this.users.find((user) => user.id === id);
  }

  createUser(user: User): void {
    this.users.push(user);
  }

  updateUser(id: string, user: User): void {
    const index = this.users.findIndex((u) => u.id === id);
    if (index !== -1) {
      this.users[index] = user;
    }
  }

  deleteUser(id: string): void {
    this.users = this.users.filter((user) => user.id !== id);
  }
}
