/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { EnrollmentService } from './enrollment.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiResponseService } from '../shared/api-rensponse.service';
import { Role } from '../../generated/prisma';

@Controller('enrollments')
@UseGuards(JwtAuthGuard)
export class EnrollmentController {
  constructor(
    private readonly enrollmentService: EnrollmentService,
    private readonly apiResponseService: ApiResponseService,
  ) {}

  @Post()
  @Roles(Role.STUDENT)
  @UseGuards(RolesGuard)
  async create(
    @Body() createEnrollmentDto: CreateEnrollmentDto,
    @CurrentUser() user: any,
  ) {
    try {
      const enrollment = await this.enrollmentService.create(
        createEnrollmentDto,
        user.id,
      );
      return this.apiResponseService.success(
        enrollment,
        'Enrolled successfully',
      );
    } catch (error: any) {
      return this.apiResponseService.error(
        error.message || 'Failed to enroll',
        'ENROLLMENT_CREATE_ERROR',
      );
    }
  }

  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('courseId') courseId?: string,
    @Query('status') status?: string,
    @CurrentUser() user?: any,
  ) {
    try {
      const result = await this.enrollmentService.findAll(
        page,
        limit,
        user.role,
        user.id,
        courseId,
        status,
      );
      return this.apiResponseService.paginated(
        result.enrollments,
        result.page,
        result.limit,
        result.total,
        'Enrollments retrieved successfully',
      );
    } catch (error: any) {
      return this.apiResponseService.error(
        error.message || 'Failed to retrieve enrollments',
        'ENROLLMENT_FETCH_ERROR',
      );
    }
  }

  @Get('my-enrollments')
  @Roles(Role.STUDENT)
  @UseGuards(RolesGuard)
  async getMyEnrollments(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @CurrentUser() user: any,
  ) {
    try {
      const result = await this.enrollmentService.getMyEnrollments(
        user.id,
        page,
        limit,
      );
      return this.apiResponseService.paginated(
        result.enrollments,
        result.page,
        result.limit,
        result.total,
        'My enrollments retrieved successfully',
      );
    } catch (error: any) {
      return this.apiResponseService.error(
        error.message || 'Failed to retrieve my enrollments',
        'MY_ENROLLMENTS_ERROR',
      );
    }
  }

  @Get('course/:courseId')
  @UseGuards(RolesGuard)
  async getCourseEnrollments(
    @Param('courseId') courseId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @CurrentUser() user: any,
  ) {
    try {
      const result = await this.enrollmentService.getCourseEnrollments(
        courseId,
        user.id,
        '', // lessonId is not used here, so pass an empty string or the appropriate value
        page,
        limit,
        user.role,
      );
      return this.apiResponseService.paginated(
        result.enrollments,
        result.page,
        result.limit,
        result.total,
        'Course enrollments retrieved successfully',
      );
    } catch (error: any) {
      return this.apiResponseService.error(
        error.message || 'Failed to retrieve course enrollments',
        'COURSE_ENROLLMENTS_ERROR',
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    try {
      const enrollment = await this.enrollmentService.findOne(
        id,
        user.role,
        user.id,
      );
      return this.apiResponseService.success(
        enrollment,
        'Enrollment retrieved successfully',
      );
    } catch (error: any) {
      return this.apiResponseService.error(
        error.message || 'Failed to retrieve enrollment',
        'ENROLLMENT_FETCH_ERROR',
      );
    }
  }

  @Get(':id/progress')
  async getProgress(@Param('id') id: string, @CurrentUser() user: any) {
    try {
      const progress = await this.enrollmentService.getProgress(
        id,
        user.role,
        user.id,
      );
      return this.apiResponseService.success(
        progress,
        'Progress retrieved successfully',
      );
    } catch (error: any) {
      return this.apiResponseService.error(
        error.message || 'Failed to retrieve progress',
        'PROGRESS_FETCH_ERROR',
      );
    }
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  async update(
    @Param('id') id: string,
    @Body() updateEnrollmentDto: UpdateEnrollmentDto,
    @CurrentUser() user: any,
  ) {
    try {
      const enrollment = await this.enrollmentService.update(
        id,
        updateEnrollmentDto,
        user.role,
        user.id,
      );
      return this.apiResponseService.success(
        enrollment,
        'Enrollment updated successfully',
      );
    } catch (error: any) {
      return this.apiResponseService.error(
        error.message || 'Failed to update enrollment',
        'ENROLLMENT_UPDATE_ERROR',
      );
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    try {
      await this.enrollmentService.remove(id, user.role, user.id);
      return this.apiResponseService.success(
        null,
        'Enrollment dropped successfully',
      );
    } catch (error: any) {
      return this.apiResponseService.error(
        error.message || 'Failed to drop enrollment',
        'ENROLLMENT_DELETE_ERROR',
      );
    }
  }
}
