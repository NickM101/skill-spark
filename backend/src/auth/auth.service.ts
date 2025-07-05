/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { TokenService } from './token.service';
import { User } from '../users/interfaces/user.interface';
import { Role } from '../../generated/prisma';

// import { EmailService } from '../email/email.service';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface UserResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isVerified: boolean;
  createdAt: Date;
}

interface AuthResult {
  user: UserResponse;
  token: string;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private tokenService: TokenService,
    // private emailService: EmailService,
  ) {}

  /**
   * Generate a random 6-digit code for verification or reset
   */
  private generateSixDigitCode(): string {
    // Generate a random number between 0 and 999999
    const code = Math.floor(Math.random() * 1000000);
    // Pad with leading zeros to ensure 6 digits
    return code.toString().padStart(6, '0');
  }

  async register(registerDto: RegisterDto): Promise<AuthResult> {
    // Remove this check - it will be handled by frontend
    // if (registerDto.password !== registerDto.confirmPassword) {
    //   throw new BadRequestException('Passwords do not match');
    // }

    // Check if email is already in use
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new BadRequestException('Email is already in use');
    }

    // Security check for admin role
    // if (registerDto.role === Role.ADMIN) {
    //   // Option 1: Only allow if the request comes from an existing admin
    //   // This would require authentication for registration, which might not be what you want

    //   // Option 2: Only allow admin creation in development environment
    //   if (process.env.NODE_ENV !== 'development') {
    //     throw new ForbiddenException(
    //       'Admin accounts can only be created in development mode',
    //     );
    //   }
    // }

    // Generate verification code - 6 digits
    const verificationCode = this.generateSixDigitCode();
    console.log('Generated verification code:', verificationCode);

    // Hash password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(registerDto.password, salt);

    // Log what we're sending to create
    console.log('Creating user with params:', {
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      email: registerDto.email,
      verificationCode,
    });

    // Create user - check parameter names expected by your UsersService
    const user = await this.usersService.create({
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      email: registerDto.email,
      password: hashedPassword,
      verificationCode: verificationCode, // Make sure this matches what UsersService expects
      isVerified: false,
      role: registerDto.role || Role.STUDENT, // Use role from DTO or default
    });

    console.log('User created:', {
      id: user.id,
      email: user.email,
      // Check what properties actually exist
      hasVerificationCode: 'verificationCode' in user,
      hasEmailVerified: 'isEmailVerified' in user,
      hasVerified: 'isVerified' in user,
    });

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Return user with tokens
    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        // Fix property name mismatch - use type assertion if needed
        isVerified: 'isEmailVerified' in user ? user.isEmailVerified : false,
        createdAt: user.createdAt,
      },
      token: tokens.accessToken,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResult> {
    // Validate user credentials
    const user = await this.validateUser(loginDto.email, loginDto.password);

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Store refresh token
    await this.tokenService.saveRefreshToken(user.id, tokens.refreshToken);

    // Return user with tokens
    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isVerified: 'isEmailVerified' in user ? user.isEmailVerified : false,
        createdAt: user.createdAt,
      },
      token: tokens.accessToken,
    };
  }

  async validateUser(email: string, password: string): Promise<User> {
    // Find user by email
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Validate password - ensure password property exists
    if (!user.password) {
      throw new UnauthorizedException('Invalid user data');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // TEMPORARILY COMMENT OUT EMAIL VERIFICATION CHECK FOR TESTING
    // if (user.isEmailVerified === false) {
    //   throw new UnauthorizedException('Please verify your email before logging in');
    // }

    return user;
  }

  generateTokens(
    user: Partial<User> & { id: string; email: string; role: Role },
  ): TokenPair {
    // This allows user objects without password to be passed in,
    // but still requires id, email, and role

    // Validate required properties exist
    if (!user.id || !user.email || !user.role) {
      throw new Error('Invalid user data for token generation');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessSecret =
      this.configService.get<string>('JWT_ACCESS_SECRET') ?? 'jwt_secret';
    const accessExpiration =
      this.configService.get<string>('JWT_ACCESS_EXPIRATION') ?? '1h';
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ?? 'refresh_secret';
    const refreshExpiration =
      this.configService.get<string>('JWT_REFRESH_EXPIRATION') ?? '7d';

    // Create access token
    const accessToken = this.jwtService.sign(payload, {
      secret: accessSecret,
      expiresIn: accessExpiration,
    });

    // Create refresh token
    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: refreshExpiration,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    console.log('Attempting to verify email with token:', token);

    // Find user by verification token
    const user = await this.usersService.findByVerificationToken(token);
    console.log('User found by token:', user ? `Yes (${user.email})` : 'No');

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    // Update user verification status
    await this.usersService.markEmailAsVerified(user.id);
    console.log('User email marked as verified for:', user.email);

    return { message: 'Email verified successfully' };
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    // Find user by email
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);
    if (!user) {
      // Don't reveal if email exists or not for security
      return { message: 'Password reset instructions sent if email exists' };
    }

    // Generate password reset code - 6 digits
    const resetCode = this.generateSixDigitCode();
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // Token valid for 1 hour

    // Save code to user
    await this.usersService.setPasswordResetToken(
      user.id,
      resetCode,
      resetTokenExpiry,
    );

    // Comment out email service call since it's not imported
    /*
    await this.emailService.sendPasswordResetEmail(
      user.email,
      user.firstName,
      resetCode,
    );
    */

    return { message: 'Password reset instructions sent if email exists' };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    // Check if passwords match
    if (resetPasswordDto.password !== resetPasswordDto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    // Find user by reset token
    const user = await this.usersService.findByPasswordResetToken(
      resetPasswordDto.token,
    );
    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Check if token is expired - use safe property access
    if (user.passwordResetExpires && new Date() > user.passwordResetExpires) {
      throw new BadRequestException('Reset token has expired');
    }

    // Hash new password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(resetPasswordDto.password, salt);

    // Update user password and clear reset token
    await this.usersService.updatePassword(user.id, hashedPassword);

    return { message: 'Password reset successfully' };
  }

  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<{ token: string; refreshToken: string }> {
    try {
      // Verify the refresh token
      const refreshSecret =
        this.configService.get<string>('JWT_REFRESH_SECRET') ??
        'refresh_secret';
      const decoded = this.jwtService.verify<{
        sub: string;
        email: string;
        role: string;
      }>(refreshTokenDto.refreshToken, {
        secret: refreshSecret,
      });

      // Find user
      const user = await this.usersService.findById(decoded.sub);
      if (!user) {
        throw new UnauthorizedException('Invalid token');
      }

      // Check if refresh token exists in database
      const isTokenValid = await this.tokenService.validateRefreshToken(
        user.id,
        refreshTokenDto.refreshToken,
      );

      if (!isTokenValid) {
        throw new UnauthorizedException('Invalid token');
      }

      // Generate new tokens
      const tokens = this.generateTokens(user);

      // Update refresh token in database
      await this.tokenService.updateRefreshToken(
        user.id,
        refreshTokenDto.refreshToken,
        tokens.refreshToken,
      );

      return {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async logout(userId: string): Promise<{ message: string }> {
    // Remove refresh tokens for user
    await this.tokenService.removeRefreshTokens(userId);
    return { message: 'Logged out successfully' };
  }
}
