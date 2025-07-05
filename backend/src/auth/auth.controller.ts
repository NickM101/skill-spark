/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Get,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { ApiResponseService } from '../shared/api-rensponse.service';
import {
  ApiResponse,
  LoginResponse,
  RegisterResponse,
} from '../shared/interfaces/api-rensponse.interface';
import { User } from '../users/interfaces/user.interface';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly apiResponseService: ApiResponseService,
  ) {}

  @Public()
  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<ApiResponse<RegisterResponse['data']>> {
    try {
      const result = await this.authService.register(registerDto);
      return this.apiResponseService.success(
        result,
        'Registration successful. Please check your email for verification.',
      );
    } catch (error) {
      return this.apiResponseService.error(
        error instanceof Error ? error.message : 'Registration failed',
        'REGISTRATION_ERROR',
      );
    }
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
  ): Promise<ApiResponse<LoginResponse['data']>> {
    try {
      const result = await this.authService.login(loginDto);
      return this.apiResponseService.success(result, 'Login successful');
    } catch (error) {
      // Throw appropriate HTTP exception
      if (error.message === 'Invalid credentials') {
        throw new UnauthorizedException({
          message: error.message,
          code: 'LOGIN_ERROR',
        });
      }
      throw new InternalServerErrorException({
        message: 'Login failed',
        code: 'LOGIN_ERROR',
      });
    }
  }

  @Public()
  @Post('verify-email')
  async verifyEmail(@Body() body: { token: string }): Promise<ApiResponse> {
    try {
      const result = await this.authService.verifyEmail(body.token);
      return this.apiResponseService.success(
        result,
        'Email verified successfully',
      );
    } catch (error) {
      return this.apiResponseService.error(
        error instanceof Error ? error.message : 'Email verification failed',
        'EMAIL_VERIFICATION_ERROR',
      );
    }
  }

  @Public()
  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    try {
      const result = await this.authService.forgotPassword(forgotPasswordDto);
      return this.apiResponseService.success(
        result,
        'Password reset instructions sent if email exists',
      );
    } catch (error) {
      return this.apiResponseService.error(
        'Failed to process password reset request',
        'PASSWORD_RESET_REQUEST_ERROR',
      );
    }
  }

  @Public()
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    try {
      const result = await this.authService.resetPassword(resetPasswordDto);
      return this.apiResponseService.success(
        result,
        'Password reset successfully',
      );
    } catch (error) {
      return this.apiResponseService.error(
        error instanceof Error ? error.message : 'Password reset failed',
        'PASSWORD_RESET_ERROR',
      );
    }
  }

  @Public()
  @Post('refresh-token')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    try {
      const result = await this.authService.refreshToken(refreshTokenDto);
      return this.apiResponseService.success(
        result,
        'Token refreshed successfully',
      );
    } catch (error) {
      return this.apiResponseService.error(
        error instanceof Error ? error.message : 'Token refresh failed',
        'TOKEN_REFRESH_ERROR',
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@CurrentUser() user: User) {
    try {
      const result = await this.authService.logout(user.id);
      return this.apiResponseService.success(result, 'Logged out successfully');
    } catch (error) {
      return this.apiResponseService.error(
        error instanceof Error ? error.message : 'Logout failed',
        'LOGOUT_ERROR',
      );
    }
  }
}
