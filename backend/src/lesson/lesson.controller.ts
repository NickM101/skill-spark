/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { LessonService } from './lesson.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiResponseService } from '../shared/api-rensponse.service';
import { Role } from '../../generated/prisma';

@Controller('courses/:courseId/lessons')
@UseGuards(JwtAuthGuard)
export class LessonController {
  constructor(
    private readonly lessonService: LessonService,
    private readonly apiResponseService: ApiResponseService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  async create(
    @Param('courseId') courseId: string,
    @Body() createLessonDto: CreateLessonDto,
    @CurrentUser() user: any,
  ) {
    try {
      const lesson = await this.lessonService.create(
        courseId,
        createLessonDto,
        user.role,
        user.id,
      );
      return this.apiResponseService.success(
        lesson,
        'Lesson created successfully',
      );
    } catch (error: any) {
      return this.apiResponseService.error(
        error.message || 'Failed to create lesson',
        'LESSON_CREATE_ERROR',
      );
    }
  }

  @Get()
  async findAll(
    @Param('courseId') courseId: string,
    @CurrentUser() user: any,
    @Query('isPublished') isPublished?: boolean,
  ) {
    try {
      const lessons = await this.lessonService.findAll(
        courseId,
        user.role,
        user.id,
        isPublished,
      );
      return this.apiResponseService.success(
        lessons,
        'Lessons retrieved successfully',
      );
    } catch (error: any) {
      return this.apiResponseService.error(
        error.message || 'Failed to retrieve lessons',
        'LESSON_FETCH_ERROR',
      );
    }
  }

  @Get(':id')
  async findOne(
    @Param('courseId') courseId: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    try {
      const lesson = await this.lessonService.findOne(
        courseId,
        id,
        user.role,
        user.id,
      );
      return this.apiResponseService.success(
        lesson,
        'Lesson retrieved successfully',
      );
    } catch (error: any) {
      return this.apiResponseService.error(
        error.message || 'Failed to retrieve lesson',
        'LESSON_FETCH_ERROR',
      );
    }
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  async update(
    @Param('courseId') courseId: string,
    @Param('id') id: string,
    @Body() updateLessonDto: UpdateLessonDto,
    @CurrentUser() user: any,
  ) {
    try {
      const lesson = await this.lessonService.update(
        courseId,
        id,
        updateLessonDto,
        user.role,
        user.id,
      );
      return this.apiResponseService.success(
        lesson,
        'Lesson updated successfully',
      );
    } catch (error: any) {
      return this.apiResponseService.error(
        error.message || 'Failed to update lesson',
        'LESSON_UPDATE_ERROR',
      );
    }
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  async remove(
    @Param('courseId') courseId: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    try {
      await this.lessonService.remove(courseId, id, user.role, user.id);
      return this.apiResponseService.success(
        null,
        'Lesson deleted successfully',
      );
    } catch (error: any) {
      return this.apiResponseService.error(
        error.message || 'Failed to delete lesson',
        'LESSON_DELETE_ERROR',
      );
    }
  }

  @Patch('reorder')
  @UseGuards(RolesGuard)
  async reorder(
    @Param('courseId') courseId: string,
    @Body() body: { lessonIds: string[] },
    @CurrentUser() user: any,
  ) {
    try {
      const lessons = await this.lessonService.reorderLessons(
        courseId,
        body.lessonIds,
        user.role,
        user.id,
      );
      return this.apiResponseService.success(
        lessons,
        'Lessons reordered successfully',
      );
    } catch (error: any) {
      return this.apiResponseService.error(
        error.message || 'Failed to reorder lessons',
        'LESSON_REORDER_ERROR',
      );
    }
  }

  @Post(':id/publish')
  @UseGuards(RolesGuard)
  async publish(
    @Param('courseId') courseId: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    try {
      const lesson = await this.lessonService.publish(
        courseId,
        id,
        user.role,
        user.id,
      );
      return this.apiResponseService.success(
        lesson,
        'Lesson published successfully',
      );
    } catch (error: any) {
      return this.apiResponseService.error(
        error.message || 'Failed to publish lesson',
        'LESSON_PUBLISH_ERROR',
      );
    }
  }

  @Post(':id/unpublish')
  @UseGuards(RolesGuard)
  async unpublish(
    @Param('courseId') courseId: string,
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    try {
      const lesson = await this.lessonService.unpublish(
        courseId,
        id,
        user.role,
        user.id,
      );
      return this.apiResponseService.success(
        lesson,
        'Lesson unpublished successfully',
      );
    } catch (error: any) {
      return this.apiResponseService.error(
        error.message || 'Failed to unpublish lesson',
        'LESSON_UNPUBLISH_ERROR',
      );
    }
  }

  @Post('publish-all')
  @Roles(Role.ADMIN, Role.INSTRUCTOR)
  @UseGuards(RolesGuard)
  async publishAll(
    @Param('courseId') courseId: string,
    @CurrentUser() user: any,
  ) {
    try {
      const lessons = await this.lessonService.publishAll(
        courseId,
        user.role,
        user.id,
      );
      return this.apiResponseService.success(
        lessons,
        'All lessons published successfully',
      );
    } catch (error: any) {
      return this.apiResponseService.error(
        error.message || 'Failed to publish all lessons',
        'LESSONS_PUBLISH_ALL_ERROR',
      );
    }
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  async getLessonStats(
    @Param('courseId') courseId: string,
    @CurrentUser() user: any,
  ) {
    try {
      const stats = await this.lessonService.getLessonStats(
        courseId,
        user.role,
        user.id,
      );
      return this.apiResponseService.success(
        stats,
        'Lesson statistics retrieved successfully',
      );
    } catch (error: any) {
      return this.apiResponseService.error(
        error.message || 'Failed to retrieve lesson statistics',
        'LESSON_STATS_ERROR',
      );
    }
  }
}
