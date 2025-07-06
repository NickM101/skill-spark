export enum Role {
  ADMIN = 'ADMIN',
  INSTRUCTOR = 'INSTRUCTOR',
  STUDENT = 'STUDENT',
}

export interface User {
  id: string;
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  role: Role;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Computed properties for display
  fullName?: string;
  enrollmentCount?: number;
  courseCount?: number;
}

export interface UserFilters {
  role?: Role | '';
  isActive?: boolean | '';
  isEmailVerified?: boolean | '';
  search?: string;
}

export interface UserResponse {
  users: User[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  password: string;
}

export interface UpdateUserRequest {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: Role;
  isActive?: boolean;
  isEmailVerified?: boolean;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  verifiedUsers: number;
  roleDistribution: {
    [key in Role]: number;
  };
}

export interface BulkActionRequest {
  userIds: string[];
  action: 'activate' | 'deactivate' | 'verify' | 'delete';
}

export interface UserTableColumn {
  key: keyof User | 'actions';
  label: string;
  sortable: boolean;
  width?: string;
}