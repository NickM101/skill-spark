/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../shared/cloudinary/cloudinary.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserWithoutPassword } from './interfaces/user.interface';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Create a new user with hashed password
   */
  async create(createUserDto: CreateUserDto) {
    // Check if email already exists
    const existingUser = await this.findByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('Email is already in use');
    }

    // Create the user (password should already be hashed when passed in)
    return this.prisma.user.create({
      data: {
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        email: createUserDto.email,
        password: createUserDto.password,
        role: createUserDto.role || 'STUDENT',
        verificationCode: createUserDto.verificationCode,
        verificationExpires: createUserDto.verificationExpires,
        isEmailVerified: createUserDto.isEmailVerified || false,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isEmailVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Find a user by email
   */
  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Find a user by ID
   */
  async findById(id: string): Promise<UserWithoutPassword> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isEmailVerified: true,
        isActive: true,
        profilePhotoUrl: true,
        profilePhotoId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  /**
   * Find a user by verification token
   */
  findByVerificationToken(token: string) {
    return this.prisma.user.findFirst({
      where: {
        verificationCode: token,
        verificationExpires: {
          gt: new Date(),
        },
      },
    });
  }

  /**
   * Find a user by password reset token
   */
  findByPasswordResetToken(token: string) {
    return this.prisma.user.findFirst({
      where: { passwordResetCode: token },
    });
  }

  /**
   * Get all users (for admin)
   */
  async findAll(page = 1, limit = 10, excludeUserId?: string) {
    const skip = (page - 1) * limit;

    // Build where condition to exclude the current user if ID is provided
    const whereCondition = excludeUserId ? { id: { not: excludeUserId } } : {};

    const total = await this.prisma.user.count({
      where: whereCondition,
    });

    const users = await this.prisma.user.findMany({
      where: whereCondition,
      skip,
      take: limit,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isEmailVerified: true,
        isActive: true,
        profilePhotoUrl: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(id: string, updateUserDto: UpdateUserDto) {
    // Check if user exists
    await this.findById(id);

    // Update user
    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isEmailVerified: true,
        isActive: true,
        profilePhotoUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Find a user by ID with password
   */
  async findByIdWithPassword(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  /**
   * Change user password
   */
  async changePassword(id: string, changePasswordDto: ChangePasswordDto) {
    // Check if user exists with password
    const user = await this.findByIdWithPassword(id);

    // Validate current password
    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Check if passwords match
    if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    // Hash new password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(
      changePasswordDto.newPassword,
      salt,
    );

    // Update password
    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return { message: 'Password changed successfully' };
  }

  /**
   * Toggle user active status
   */
  async toggleActiveStatus(id: string) {
    // Check if user exists
    const user = await this.findById(id);

    // Toggle status
    return this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isEmailVerified: true,
        isActive: true,
        profilePhotoUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Mark email as verified and clear verification fields
   */
  markEmailAsVerified(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: {
        isEmailVerified: true,
        verificationCode: null,
        verificationExpires: null,
      },
    });
  }

  /**
   * Set password reset token
   */
  setPasswordResetToken(id: string, token: string, expires: Date) {
    return this.prisma.user.update({
      where: { id },
      data: {
        passwordResetCode: token,
        passwordResetExpires: expires,
      },
    });
  }

  /**
   * Update password (for password reset)
   */
  updatePassword(id: string, password: string) {
    return this.prisma.user.update({
      where: { id },
      data: {
        password,
        passwordResetCode: null,
        passwordResetExpires: null,
      },
    });
  }

  /**
   * Upload profile photo
   */
  async uploadProfilePhoto(userId: string, file: Express.Multer.File) {
    // Verify user exists
    const user = await this.findById(userId);

    // Check if file is provided
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Check file type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/webp',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Allowed types: JPEG, PNG, JPG, WEBP',
      );
    }

    try {
      // If user already has a profile photo, delete it first
      if (user.profilePhotoId) {
        await this.cloudinaryService
          .deleteFile(user.profilePhotoId)
          .catch((error) => {
            console.error('Failed to delete old profile photo:', error);
          });
      }

      // Upload new photo to Cloudinary
      const result = await this.cloudinaryService.uploadImage(
        file,
        'profile-photos',
      );

      // Check both success flag AND existence of data
      if (!result.success || !result.data) {
        throw new InternalServerErrorException(
          result.error || 'Failed to upload image to cloud storage',
        );
      }

      // Now TypeScript knows result.data exists
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          profilePhotoId: result.data.public_id,
          profilePhotoUrl: result.data.secure_url,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          isEmailVerified: true,
          isActive: true,
          profilePhotoUrl: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return updatedUser;
    } catch (error) {
      if (
        error instanceof InternalServerErrorException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Failed to update profile photo: ${error.message}`,
      );
    }
  }

  /**
   * Delete user's profile photo
   */
  async deleteProfilePhoto(userId: string) {
    // Verify user exists
    const user = await this.findById(userId);

    // Check if user has a profile photo
    if (!user.profilePhotoId) {
      throw new BadRequestException('User does not have a profile photo');
    }

    try {
      // Delete photo from Cloudinary
      await this.cloudinaryService.deleteFile(user.profilePhotoId);

      // Update user record
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          profilePhotoId: null,
          profilePhotoUrl: null,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          isEmailVerified: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return updatedUser;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to delete profile photo: ${error.message}`,
      );
    }
  }

  /**
   * Delete a user (admin only)
   */
  async deleteUser(id: string) {
    // Check if user exists
    await this.findById(id);

    // Use transaction to ensure all related data is deleted properly
    await this.prisma.$transaction(async (prisma) => {
      // Delete all related refresh tokens first
      await prisma.refreshToken.deleteMany({
        where: { userId: id },
      });

      // Delete all related progress records
      await prisma.progress.deleteMany({
        where: { userId: id },
      });

      // Delete all related quiz attempts and their answers
      const quizAttempts = await prisma.quizAttempt.findMany({
        where: { userId: id },
        select: { id: true },
      });

      if (quizAttempts.length > 0) {
        // Delete answers for all quiz attempts
        await prisma.answer.deleteMany({
          where: {
            attemptId: {
              in: quizAttempts.map((attempt) => attempt.id),
            },
          },
        });

        // Delete quiz attempts
        await prisma.quizAttempt.deleteMany({
          where: { userId: id },
        });
      }

      // Delete all enrollments
      await prisma.enrollment.deleteMany({
        where: { userId: id },
      });

      // For instructors: Handle courses they've created
      const userCourses = await prisma.course.findMany({
        where: { instructorId: id },
        select: { id: true },
      });

      if (userCourses.length > 0) {
        throw new BadRequestException(
          'Cannot delete user with existing courses. Please reassign or delete courses first.',
        );
      }

      // Delete the user's profile photo from Cloudinary if exists
      const user = await prisma.user.findUnique({
        where: { id },
        select: { profilePhotoId: true },
      });

      if (user?.profilePhotoId) {
        try {
          await this.cloudinaryService.deleteFile(user.profilePhotoId);
        } catch (error) {
          console.error(
            'Failed to delete profile photo from Cloudinary:',
            error,
          );
        }
      }

      // Finally, delete the user
      await prisma.user.delete({
        where: { id },
      });
    });

    return { message: 'User deleted successfully' };
  }
}
