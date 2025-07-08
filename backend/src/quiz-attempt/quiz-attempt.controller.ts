import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { QuizAttemptService } from './quiz-attempt.service';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiResponseService } from '../shared/api-rensponse.service';
import { Role } from '../../generated/prisma';

@Controller('quiz-attempts')
@UseGuards(JwtAuthGuard)
export class QuizAttemptController {
  constructor(
    private readonly quizAttemptService: QuizAttemptService,
    private readonly apiResponseService: ApiResponseService,
  ) {}

  /**
   * Start a new quiz attempt
   */
  @Post('quizzes/:quizId/attempts')
  @Roles(Role.STUDENT)
  @UseGuards(RolesGuard)
  async startAttempt(
    @Param('quizId', ParseUUIDPipe) quizId: string,
    @CurrentUser() user: { id: string },
  ) {
    try {
      const attempt = await this.quizAttemptService.startAttempt(
        user.id,
        quizId,
      );
      return this.apiResponseService.success(
        attempt,
        'Quiz attempt started successfully',
      );
    } catch (error) {
      return this.apiResponseService.error(
        error instanceof Error ? error.message : 'Failed to start quiz attempt',
        'QUIZ_ATTEMPT_START_ERROR',
      );
    }
  }

  /**
   * Get user's attempts for a quiz
   */
  @Get('quizzes/:quizId/attempts')
  @Roles(Role.STUDENT)
  @UseGuards(RolesGuard)
  async findUserAttempts(
    @Param('quizId', ParseUUIDPipe) quizId: string,
    @CurrentUser() user: { id: string },
  ) {
    try {
      const attempts = await this.quizAttemptService.findUserAttempts(
        user.id,
        quizId,
      );
      return this.apiResponseService.success(
        attempts,
        'User attempts retrieved successfully',
      );
    } catch (error) {
      return this.apiResponseService.error(
        error instanceof Error
          ? error.message
          : 'Failed to retrieve user attempts',
        'USER_ATTEMPTS_FETCH_ERROR',
      );
    }
  }

  /**
   * Get specific attempt details
   */
  @Get('attempts/:id')
  @Roles(Role.STUDENT)
  @UseGuards(RolesGuard)
  async findAttempt(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { id: string },
  ) {
    try {
      const attempt = await this.quizAttemptService.findAttempt(id, user.id);
      return this.apiResponseService.success(
        attempt,
        'Attempt retrieved successfully',
      );
    } catch (error) {
      return this.apiResponseService.error(
        error instanceof Error ? error.message : 'Failed to retrieve attempt',
        'ATTEMPT_FETCH_ERROR',
      );
    }
  }

  /**
   * Submit an answer
   */
  @Post('attempts/:id/answers')
  @Roles(Role.STUDENT)
  @UseGuards(RolesGuard)
  async submitAnswer(
    @Param('id', ParseUUIDPipe) attemptId: string,
    @Body() submitAnswerDto: SubmitAnswerDto,
    @CurrentUser() user: { id: string },
  ) {
    try {
      const answer = await this.quizAttemptService.submitAnswer(
        attemptId,
        user.id,
        submitAnswerDto,
      );
      return this.apiResponseService.success(
        answer,
        'Answer submitted successfully',
      );
    } catch (error) {
      return this.apiResponseService.error(
        error instanceof Error ? error.message : 'Failed to submit answer',
        'ANSWER_SUBMIT_ERROR',
      );
    }
  }

  /**
   * Submit quiz
   */
  @Post('attempts/:id/submit')
  @Roles(Role.STUDENT)
  @UseGuards(RolesGuard)
  async submitQuiz(
    @Param('id', ParseUUIDPipe) attemptId: string,
    @CurrentUser() user: { id: string },
  ) {
    try {
      const submission = await this.quizAttemptService.submitQuiz(
        attemptId,
        user.id,
      );
      return this.apiResponseService.success(
        submission,
        'Quiz submitted successfully',
      );
    } catch (error) {
      return this.apiResponseService.error(
        error instanceof Error ? error.message : 'Failed to submit quiz',
        'QUIZ_SUBMIT_ERROR',
      );
    }
  }

  /**
   * Get quiz attempt statistics (instructor only)
   */
  @Get('quizzes/:quizId/attempts/stats')
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @UseGuards(RolesGuard)
  async getAttemptStats(
    @Param('quizId', ParseUUIDPipe) quizId: string,
    @CurrentUser() user: { id: string },
  ) {
    try {
      const stats = await this.quizAttemptService.getAttemptStats(
        quizId,
        user.id,
      );
      return this.apiResponseService.success(
        stats,
        'Attempt statistics retrieved successfully',
      );
    } catch (error) {
      return this.apiResponseService.error(
        error instanceof Error
          ? error.message
          : 'Failed to retrieve attempt statistics',
        'ATTEMPT_STATS_ERROR',
      );
    }
  }

  /**
   * Grade attempt (instructor only)
   */
  @Post('attempts/:id/grade')
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @UseGuards(RolesGuard)
  async gradeAttempt(
    @Param('id', ParseUUIDPipe) attemptId: string,
    @CurrentUser() user: { id: string },
  ) {
    try {
      const gradedAttempt = await this.quizAttemptService.gradeAttempt(
        attemptId,
        user.id,
      );
      return this.apiResponseService.success(
        gradedAttempt,
        'Attempt graded successfully',
      );
    } catch (error) {
      return this.apiResponseService.error(
        error instanceof Error ? error.message : 'Failed to grade attempt',
        'ATTEMPT_GRADE_ERROR',
      );
    }
  }
}
