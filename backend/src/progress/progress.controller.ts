/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Controller, Post, Param, UseGuards } from '@nestjs/common';
import { EnrollmentService } from '../enrollment/enrollment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiResponseService } from '../shared/api-rensponse.service';
import { Role } from '../../generated/prisma';

@Controller('lessons')
@UseGuards(JwtAuthGuard)
export class ProgressController {
  constructor(
    private readonly enrollmentService: EnrollmentService,
    private readonly apiResponseService: ApiResponseService,
  ) {}

  @Post(':lessonId/progress')
  @Roles(Role.STUDENT)
  @UseGuards(RolesGuard)
  async markLessonComplete(
    @Param('lessonId') lessonId: string,
    @CurrentUser() user: any,
  ) {
    try {
      const progress = await this.enrollmentService.markLessonComplete(
        lessonId,
        user.id,
      );
      return this.apiResponseService.success(
        progress,
        'Lesson marked as completed',
      );
    } catch (error: any) {
      return this.apiResponseService.error(
        error.message || 'Failed to mark lesson as complete',
        'LESSON_PROGRESS_ERROR',
      );
    }
  }
}
