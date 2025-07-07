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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CourseService } from './course.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { AssignInstructorDto } from './dto/assign-instructor.dto';
import { CourseQueryDto } from './dto/course-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ApiResponseService } from '../shared/api-rensponse.service';
import { Role } from '../../generated/prisma';

@Controller('courses')
@UseGuards(JwtAuthGuard)
export class CourseController {
  constructor(
    private readonly courseService: CourseService,
    private readonly apiResponseService: ApiResponseService,
  ) {}

  @Post()
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  async create(
    @Body() createCourseDto: CreateCourseDto,
    @CurrentUser() user: any,
  ) {
    try {
      const course = await this.courseService.create(createCourseDto, user.id);
      return this.apiResponseService.success(
        course,
        'Course created successfully',
      );
    } catch (error: any) {
      return this.apiResponseService.error(
        error.message || 'Failed to create course',
        'COURSE_CREATE_ERROR',
      );
    }
  }

  @Get()
  async findAll(
    @Query() query: CourseQueryDto,
    @CurrentUser() user: any,
  ) {
    try {
      const result = await this.courseService.findAll(
        query,
        user.role,
        user.id,
      );
      return this.apiResponseService.paginated(
        result.courses,
        result.page,
        result.limit,
        result.total,
        'Courses retrieved successfully',
      );
    } catch (error: any) {
      return this.apiResponseService.error(
        error.message || 'Failed to retrieve courses',
        'COURSE_FETCH_ERROR',
      );
    }
  }

  @Get('my-courses')
  @Roles(Role.INSTRUCTOR)
  @UseGuards(RolesGuard)
  async getMyCourses(
    @Query() query: CourseQueryDto,
    @CurrentUser() user: any,
  ) {
    try {
      const result = await this.courseService.getMyCourses(user.id, query);
      return this.apiResponseService.paginated(
        result.courses,
        result.page,
        result.limit,
        result.total,
        'My courses retrieved successfully',
      );
    } catch (error: any) {
      return this.apiResponseService.error(
        error.message || 'Failed to retrieve my courses',
        'MY_COURSES_ERROR',
      );
    }
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    try {
      const course = await this.courseService.findOne(id, user.role, user.id);
      return this.apiResponseService.success(
        course,
        'Course retrieved successfully',
      );
    } catch (error: any) {
      return this.apiResponseService.error(
        error.message || 'Failed to retrieve course',
        'COURSE_FETCH_ERROR',
      );
    }
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  async update(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
    @CurrentUser() user: any,
  ) {
    try {
      const course = await this.courseService.update(
        id,
        updateCourseDto,
        user.role,
        user.id,
      );
      return this.apiResponseService.success(
        course,
        'Course updated successfully',
      );
    } catch (error: any) {
      return this.apiResponseService.error(
        error.message || 'Failed to update course',
        'COURSE_UPDATE_ERROR',
      );
    }
  }

  @Patch(':id/assign-instructor')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  async assignInstructor(
    @Param('id') id: string,
    @Body() assignInstructorDto: AssignInstructorDto,
    @CurrentUser() user: any,
  ) {
    try {
      const course = await this.courseService.assignInstructor(
        id,
        assignInstructorDto,
        user.id,
      );
      return this.apiResponseService.success(
        course,
        'Instructor assigned successfully',
      );
    } catch (error: any) {
      return this.apiResponseService.error(
        error.message || 'Failed to assign instructor',
        'INSTRUCTOR_ASSIGN_ERROR',
      );
    }
  }

  @Post(':id/publish')
  @UseGuards(RolesGuard)
  async publish(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    try {
      const course = await this.courseService.publish(id, user.role, user.id);
      return this.apiResponseService.success(
        course,
        'Course published successfully',
      );
    } catch (error: any) {
      return this.apiResponseService.error(
        error.message || 'Failed to publish course',
        'COURSE_PUBLISH_ERROR',
      );
    }
  }

  @Post(':id/unpublish')
  @UseGuards(RolesGuard)
  async unpublish(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    try {
      const course = await this.courseService.unpublish(id, user.role, user.id);
      return this.apiResponseService.success(
        course,
        'Course unpublished successfully',
      );
    } catch (error: any) {
      return this.apiResponseService.error(
        error.message || 'Failed to unpublish course',
        'COURSE_UNPUBLISH_ERROR',
      );
    }
  }

  @Post(':id/thumbnail')
  @UseGuards(RolesGuard)
  @UseInterceptors(FileInterceptor('thumbnail'))
  async uploadThumbnail(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: any,
  ) {
    try {
      const course = await this.courseService.uploadCourseThumbnail(
        id,
        file,
        user.role,
        user.id,
      );
      return this.apiResponseService.success(
        course,
        'Thumbnail uploaded successfully',
      );
    } catch (error: any) {
      return this.apiResponseService.error(
        error.message || 'Failed to upload thumbnail',
        'THUMBNAIL_UPLOAD_ERROR',
      );
    }
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    try {
      await this.courseService.remove(id, user.id);
      return this.apiResponseService.success(
        null,
        'Course deleted successfully',
      );
    } catch (error: any) {
      return this.apiResponseService.error(
        error.message || 'Failed to delete course',
        'COURSE_DELETE_ERROR',
      );
    }
  }
}
