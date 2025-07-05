/* eslint-disable @typescript-eslint/no-empty-object-type */

// Base response interface
export interface ApiResponse<T = any> {
  message: string;
  data?: T;
  meta?: Record<string, any>;
}

// Error response interface
export interface ApiErrorResponse {
  message: string;
  error: {
    code: string;
    details?: any[];
  };
}

// Meta data for pagination
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Authentication specific response interfaces
export interface AuthResponse {
  message: string;
  data: {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
      isVerified: boolean;
      createdAt: Date;
    };
    token: string;
  };
}

export interface LoginResponse extends AuthResponse {}

export interface RegisterResponse extends AuthResponse {}

export interface ProfileResponse {
  message: string;
  data: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: string;
    isVerified: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
}
