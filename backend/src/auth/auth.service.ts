/* eslint-disable @typescript-eslint/no-unused-vars */

import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
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
import {
  RegisterResponseDto,
  LoginResponseDto,
  UserResponseDto,
} from './dto/auth-response.dto';
import { TokenService } from './token.service';
import { User, UserWithoutPassword } from '../users/interfaces/user.interface';
import { Role } from '../../generated/prisma';
import { EmailService } from '../shared/email/email.service';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private tokenService: TokenService,
    private emailService: EmailService,
  ) {}

  /**
   * Generate a random 6-digit code for verification or reset
   */
  private generateSixDigitCode(): string {
    const code = Math.floor(Math.random() * 1000000);
    return code.toString().padStart(6, '0');
  }

  private mapUserToResponse(user: UserWithoutPassword | User): UserResponseDto {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isVerified: user.isEmailVerified || false,
      createdAt: user.createdAt,
    };
  }

  async register(registerDto: RegisterDto): Promise<RegisterResponseDto> {
    // Validate password confirmation if provided
    if (
      registerDto.confirmPassword &&
      registerDto.password !== registerDto.confirmPassword
    ) {
      throw new BadRequestException('Passwords do not match');
    }

    // Check if email is already in use
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new BadRequestException('Email is already in use');
    }

    // Generate verification code
    const verificationCode = this.generateSixDigitCode();
    const verificationExpires = new Date();
    verificationExpires.setHours(verificationExpires.getHours() + 24); // 24 hours to verify

    // Hash password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(registerDto.password, salt);

    // Create user with proper data structure
    const user = await this.usersService.create({
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      email: registerDto.email,
      password: hashedPassword,
      verificationCode: verificationCode,
      verificationExpires: verificationExpires,
      isEmailVerified: false,
      role: registerDto.role || Role.STUDENT,
    });

    // Send verification email (don't fail registration if email fails)
    try {
      await this.emailService.sendWelcomeEmail(
        user.email,
        user.firstName,
        verificationCode,
      );
      console.log('Verification email sent to:', user.email);
    } catch (error) {
      console.error('Failed to send verification email:', error);
    }

    // Return user data without token
    return {
      user: this.mapUserToResponse(user),
      message:
        'Registration successful. Please check your email for verification.',
    };
  }

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    // Validate user credentials
    const user = await this.validateUser(loginDto.email, loginDto.password);

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Store refresh token
    await this.tokenService.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.mapUserToResponse(user),
      token: tokens.accessToken,
    };
  }

  async validateUser(email: string, password: string): Promise<User> {
    // Find user by email
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Validate password
    if (!user.password) {
      throw new UnauthorizedException('Invalid user data');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // FOR PRODUCTION: Uncomment this to enforce email verification
    // if (!user.isEmailVerified) {
    //   throw new UnauthorizedException('Please verify your email before logging in');
    // }

    return user;
  }

  generateTokens(
    user: Partial<User> & { id: string; email: string; role: Role },
  ): TokenPair {
    // Validate required properties
    if (!user.id || !user.email || !user.role) {
      throw new Error('Invalid user data for token generation');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessSecret =
      this.configService.get<string>('JWT_ACCESS_SECRET') || 'fallback_secret';
    const accessExpiration =
      this.configService.get<string>('JWT_ACCESS_EXPIRATION') || '1h';
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      'fallback_refresh_secret';
    const refreshExpiration =
      this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d';

    const accessToken = this.jwtService.sign(payload, {
      secret: accessSecret,
      expiresIn: accessExpiration,
    });

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
    // Find user by verification token
    const user = await this.usersService.findByVerificationToken(token);
    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    // Check if token is expired
    if (user.verificationExpires && new Date() > user.verificationExpires) {
      throw new BadRequestException('Verification token has expired');
    }

    // Mark email as verified
    await this.usersService.markEmailAsVerified(user.id);

    return { message: 'Email verified successfully' };
  }

  async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);
    if (!user) {
      return { message: 'Password reset instructions sent if email exists' };
    }

    const resetCode = this.generateSixDigitCode();
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1);

    await this.usersService.setPasswordResetToken(
      user.id,
      resetCode,
      resetTokenExpiry,
    );

    try {
      await this.emailService.sendPasswordResetEmail(
        user.email,
        user.firstName,
        resetCode,
      );
    } catch (error) {
      console.error('Failed to send password reset email:', error);
    }

    return { message: 'Password reset instructions sent if email exists' };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    if (resetPasswordDto.password !== resetPasswordDto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const user = await this.usersService.findByPasswordResetToken(
      resetPasswordDto.token,
    );
    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (user.passwordResetExpires && new Date() > user.passwordResetExpires) {
      throw new BadRequestException('Reset token has expired');
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(resetPasswordDto.password, salt);

    await this.usersService.updatePassword(user.id, hashedPassword);

    return { message: 'Password reset successfully' };
  }

  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<{ token: string; refreshToken: string }> {
    try {
      const refreshSecret =
        this.configService.get<string>('JWT_REFRESH_SECRET') ||
        'fallback_refresh_secret';
      const decoded = this.jwtService.verify<{
        sub: string;
        email: string;
        role: string;
      }>(refreshTokenDto.refreshToken, {
        secret: refreshSecret,
      });

      const user = await this.usersService.findById(decoded.sub);
      if (!user) {
        throw new UnauthorizedException('Invalid token');
      }

      const isTokenValid = await this.tokenService.validateRefreshToken(
        user.id,
        refreshTokenDto.refreshToken,
      );

      if (!isTokenValid) {
        throw new UnauthorizedException('Invalid token');
      }

      const tokens = this.generateTokens(user);

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
    await this.tokenService.removeRefreshTokens(userId);
    return { message: 'Logged out successfully' };
  }
}
