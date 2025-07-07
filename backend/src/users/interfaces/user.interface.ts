import { Role } from '../../../generated/prisma';

export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: Role;
  isEmailVerified: boolean;
  isActive: boolean;
  profilePhotoId?: string | null;
  profilePhotoUrl?: string | null;
  verificationCode?: string | null;
  verificationExpires?: Date | null;
  passwordResetCode?: string | null;
  passwordResetExpires?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type UserWithoutPassword = Omit<User, 'password'>;
