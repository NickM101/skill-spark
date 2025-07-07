import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ProgressService } from './progress.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorators';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiResponseService } from '../shared/api-rensponse.service';
import { Role } from '../../generated/prisma';

@Controller('progress')
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(
    private readonly progressService: ProgressService,
    private readonly apiResponseService: ApiResponseService,
  ) {}

  /**
   * Mark a lesson as complete
   */
  @Post('lessons/:lessonId/complete')
  @Roles(Role.STUDENT)
  async markLessonComplete(
    @CurrentUser() user: { id: string },
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
  ) {
    try {
      await this.progressService.markLessonComplete(user.id, lessonId);
      return this.apiResponseService.success(
        null,
        'Lesson marked as complete successfully',
      );
    } catch (error) {
      return this.apiResponseService.error(
        error instanceof Error
          ? error.message
          : 'Failed to mark lesson as complete',
        'PROGRESS_UPDATE_ERROR',
      );
    }
  }

  /**
   * Mark a lesson as incomplete
   */
  @Delete('lessons/:lessonId/complete')
  @Roles(Role.STUDENT)
  async markLessonIncomplete(
    @CurrentUser() user: { id: string },
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
  ) {
    try {
      await this.progressService.markLessonIncomplete(user.id, lessonId);
      return this.apiResponseService.success(
        null,
        'Lesson marked as incomplete successfully',
      );
    } catch (error) {
      return this.apiResponseService.error(
        error instanceof Error
          ? error.message
          : 'Failed to mark lesson as incomplete',
        'PROGRESS_UPDATE_ERROR',
      );
    }
  }

  /**
   * Get user's progress for a specific course
   */
  @Get('courses/:courseId')
  @Roles(Role.STUDENT)
  async getUserProgress(
    @CurrentUser() user: { id: string },
    @Param('courseId', ParseUUIDPipe) courseId: string,
  ) {
    try {
      const progress = await this.progressService.getUserProgress(
        user.id,
        courseId,
      );
      return this.apiResponseService.success(
        progress,
        'Course progress retrieved successfully',
      );
    } catch (error) {
      return this.apiResponseService.error(
        error instanceof Error
          ? error.message
          : 'Failed to retrieve course progress',
        'PROGRESS_FETCH_ERROR',
      );
    }
  }

  /**
   * Get all students' progress for a course (instructor only)
   */
  @Get('courses/:courseId/students')
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  async getCourseProgress(@Param('courseId', ParseUUIDPipe) courseId: string) {
    try {
      const progress = await this.progressService.getCourseProgress(courseId);
      return this.apiResponseService.success(
        progress,
        'Students progress retrieved successfully',
      );
    } catch (error) {
      return this.apiResponseService.error(
        error instanceof Error
          ? error.message
          : 'Failed to retrieve students progress',
        'PROGRESS_FETCH_ERROR',
      );
    }
  }

  /**
   * Get overall progress statistics for the current user
   */
  @Get('stats')
  @Roles(Role.STUDENT)
  async getProgressStats(@CurrentUser() user: { id: string }) {
    try {
      const stats = await this.progressService.getProgressStats(user.id);
      return this.apiResponseService.success(
        stats,
        'Progress statistics retrieved successfully',
      );
    } catch (error) {
      return this.apiResponseService.error(
        error instanceof Error
          ? error.message
          : 'Failed to retrieve progress statistics',
        'PROGRESS_STATS_ERROR',
      );
    }
  }
}
