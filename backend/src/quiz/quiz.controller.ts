/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';
import { QuizService } from './quiz.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiResponseService } from '../shared/api-rensponse.service';
import { Role } from '../../generated/prisma';

@Controller('quizzes')
@UseGuards(JwtAuthGuard)
export class QuizController {
  constructor(
    private readonly quizService: QuizService,
    private readonly apiResponseService: ApiResponseService,
  ) {}

  /**
   * Create a new quiz for a course (instructor only)
   */
  @Post('courses/:courseId/quizzes')
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @UseGuards(RolesGuard)
  async create(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() createQuizDto: CreateQuizDto,
    @CurrentUser() user: { id: string },
  ) {
    try {
      const quiz = await this.quizService.create(
        courseId,
        user.id,
        createQuizDto,
      );
      return this.apiResponseService.success(quiz, 'Quiz created successfully');
    } catch (error) {
      return this.apiResponseService.error(
        error instanceof Error ? error.message : 'Failed to create quiz',
        'QUIZ_CREATE_ERROR',
      );
    }
  }

  /**
   * Get all quizzes for a course (enrolled students/instructor)
   */
  @Get('courses/:courseId/quizzes')
  async findAllByCourse(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @CurrentUser() user: { id: string },
  ) {
    try {
      const quizzes = await this.quizService.findAllByCourse(courseId, user.id);
      return this.apiResponseService.success(
        quizzes,
        'Quizzes retrieved successfully',
      );
    } catch (error) {
      return this.apiResponseService.error(
        error instanceof Error ? error.message : 'Failed to retrieve quizzes',
        'QUIZZES_FETCH_ERROR',
      );
    }
  }

  /**
   * Get a quiz by ID (enrolled students/instructor)
   */
  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
  ) {
    try {
      const quiz = await this.quizService.findOne(id, user.id);
      return this.apiResponseService.success(
        quiz,
        'Quiz retrieved successfully',
      );
    } catch (error) {
      return this.apiResponseService.error(
        error instanceof Error ? error.message : 'Failed to retrieve quiz',
        'QUIZ_FETCH_ERROR',
      );
    }
  }

  /**
   * Update a quiz (instructor only)
   */
  @Put(':id')
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @UseGuards(RolesGuard)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateQuizDto: UpdateQuizDto,
    @CurrentUser() user: { id: string },
  ) {
    try {
      const quiz = await this.quizService.update(id, user.id, updateQuizDto);
      return this.apiResponseService.success(quiz, 'Quiz updated successfully');
    } catch (error) {
      return this.apiResponseService.error(
        error instanceof Error ? error.message : 'Failed to update quiz',
        'QUIZ_UPDATE_ERROR',
      );
    }
  }

  /**
   * Delete a quiz (instructor only)
   */
  @Delete(':id')
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @UseGuards(RolesGuard)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
  ) {
    try {
      const result = await this.quizService.remove(id, user.id);
      return this.apiResponseService.success(
        result,
        'Quiz deleted successfully',
      );
    } catch (error) {
      return this.apiResponseService.error(
        error instanceof Error ? error.message : 'Failed to delete quiz',
        'QUIZ_DELETE_ERROR',
      );
    }
  }

  /**
   * Publish a quiz (instructor only)
   */
  @Patch(':id/publish')
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @UseGuards(RolesGuard)
  async publish(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
  ) {
    try {
      const quiz = await this.quizService.publish(id, user.id);
      return this.apiResponseService.success(
        quiz,
        'Quiz published successfully',
      );
    } catch (error) {
      return this.apiResponseService.error(
        error instanceof Error ? error.message : 'Failed to publish quiz',
        'QUIZ_PUBLISH_ERROR',
      );
    }
  }

  /**
   * Unpublish a quiz (instructor only)
   */
  @Patch(':id/unpublish')
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @UseGuards(RolesGuard)
  async unpublish(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
  ) {
    try {
      const quiz = await this.quizService.unpublish(id, user.id);
      return this.apiResponseService.success(
        quiz,
        'Quiz unpublished successfully',
      );
    } catch (error) {
      return this.apiResponseService.error(
        error instanceof Error ? error.message : 'Failed to unpublish quiz',
        'QUIZ_UNPUBLISH_ERROR',
      );
    }
  }

  /**
   * Get quiz statistics (instructor only)
   */
  @Get(':id/stats')
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @UseGuards(RolesGuard)
  async getQuizStats(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
  ) {
    try {
      const stats = await this.quizService.getQuizStats(id, user.id);
      return this.apiResponseService.success(
        stats,
        'Quiz statistics retrieved successfully',
      );
    } catch (error) {
      return this.apiResponseService.error(
        error instanceof Error
          ? error.message
          : 'Failed to retrieve quiz statistics',
        'QUIZ_STATS_ERROR',
      );
    }
  }
}
