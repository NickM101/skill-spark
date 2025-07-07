/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ApiResponseService } from '../shared/api-rensponse.service'; // Fixed typo in import
import { Role } from '../../generated/prisma';
import { User } from './interfaces/user.interface';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly apiResponseService: ApiResponseService,
  ) {}

  /**
   * Get current user profile
   */
  @Get('profile/me')
  async getProfile(@CurrentUser() user: User) {
    try {
      // Type guard to ensure user.id is a string
      if (!user?.id || typeof user.id !== 'string') {
        throw new Error('Invalid user ID');
      }

      const profile = await this.usersService.findById(user.id);
      return this.apiResponseService.success(
        profile,
        'Profile retrieved successfully',
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
      return this.apiResponseService.error(errorMessage, 'PROFILE_ERROR');
    }
  }

  /**
   * Update current user profile
   */
  @Put('/update/profile')
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    try {
      const updatedProfile = await this.usersService.updateProfile(
        user.id,
        updateUserDto,
      );
      return this.apiResponseService.success(
        updatedProfile,
        'Profile updated successfully',
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
      return this.apiResponseService.error(
        errorMessage,
        'PROFILE_UPDATE_ERROR',
      );
    }
  }

  /**
   * Upload profile photo
   */
  @Post('add/profile')
  @UseInterceptors(FileInterceptor('profile')) // Change to match your request
  async uploadProfilePhoto(
    @CurrentUser() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      // Type guard to ensure user.id is a string
      if (!user?.id || typeof user.id !== 'string') {
        throw new Error('Invalid user ID');
      }

      if (!file) {
        throw new Error('No file uploaded');
      }

      const updatedProfile = await this.usersService.uploadProfilePhoto(
        user.id,
        file,
      );
      return this.apiResponseService.success(
        updatedProfile,
        'Profile photo uploaded successfully',
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
      return this.apiResponseService.error(
        errorMessage,
        'PROFILE_PHOTO_UPLOAD_ERROR',
      );
    }
  }

  /**
   * Delete profile photo
   */
  @Delete('delete/profile-photo')
  async deleteProfilePhoto(@CurrentUser() user: User) {
    try {
      // Type guard to ensure user.id is a string
      if (!user?.id || typeof user.id !== 'string') {
        throw new Error('Invalid user ID');
      }

      const updatedProfile = await this.usersService.deleteProfilePhoto(
        user.id,
      );
      return this.apiResponseService.success(
        updatedProfile,
        'Profile photo deleted successfully',
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
      return this.apiResponseService.error(
        errorMessage,
        'PROFILE_PHOTO_DELETE_ERROR',
      );
    }
  }

  /**
   * Change user password
   */
  @Put('change-password')
  async changePassword(
    @CurrentUser() user: User,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    try {
      // Check if user exists and has an id property
      if (!user || typeof user.id !== 'string') {
        throw new Error('Invalid user or user ID');
      }

      const userId: string = user.id;

      // Define the expected return type from your service
      interface PasswordChangeResult {
        message: string;
        // Add other properties if needed
      }

      const result = (await this.usersService.changePassword(
        userId,
        changePasswordDto,
      )) as PasswordChangeResult;

      // Now TypeScript knows result.message exists
      return this.apiResponseService.success(null, result.message);
    } catch (error: unknown) {
      // Handle error with proper type checking
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';

      return this.apiResponseService.error(
        errorMessage,
        'PASSWORD_CHANGE_ERROR',
      );
    }
  }

  /**
   * Get all users (admin only)
   */
  @Get()
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  async getAllUsers(
    @CurrentUser() currentUser: User,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    try {
      // Pass the current admin's ID to exclude them from results
      const { data, meta } = await this.usersService.findAll(
        page,
        limit,
        currentUser.id,
      );

      return this.apiResponseService.paginated(
        data,
        page,
        limit,
        meta.total,
        'Users retrieved successfully',
      );
    } catch (error) {
      return this.apiResponseService.error(
        error instanceof Error ? error.message : 'Failed to fetch users',
        'USERS_FETCH_ERROR',
      );
    }
  }

  /**
   * Toggle user active status (admin only)
   */
  @Patch(':id/status')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  async toggleUserStatus(@Param('id') id: string) {
    try {
      const user = await this.usersService.toggleActiveStatus(id);
      const status = user.isActive ? 'activated' : 'deactivated';
      return this.apiResponseService.success(
        user,
        `User ${status} successfully`,
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
      return this.apiResponseService.error(
        errorMessage,
        'USER_STATUS_UPDATE_ERROR',
      );
    }
  }

  /**
   * Delete a user (admin only)
   */
  @Delete(':id')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  async deleteUser(@Param('id') id: string) {
    try {
      await this.usersService.deleteUser(id);
      return this.apiResponseService.success(null, 'User deleted successfully');
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unknown error occurred';
      return this.apiResponseService.error(errorMessage, 'USER_DELETE_ERROR');
    }
  }
}
