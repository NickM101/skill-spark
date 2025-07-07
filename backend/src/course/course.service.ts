import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../shared/cloudinary/cloudinary.service';
import { EmailService } from '../shared/email/email.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { AssignInstructorDto } from './dto/assign-instructor.dto';
import { CourseQueryDto } from './dto/course-query.dto';
import { CourseResponseDto } from './dto/course-response.dto';
import { Role } from '../../generated/prisma';

@Injectable()
export class CourseService {
  private readonly logger = new Logger(CourseService.name);

  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
    private emailService: EmailService,
  ) {}

  private transformCourseToResponse(course: any): CourseResponseDto {
    return {
      ...course,
      description: course.description || undefined,
      price: course.price ? Number(course.price) : undefined,
      thumbnail: course.thumbnail || undefined,
      category: course.category
        ? {
            ...course.category,
            description: course.category.description || undefined,
          }
        : undefined,
    };
  }

  async create(
    createCourseDto: CreateCourseDto,
    adminId: string,
  ): Promise<CourseResponseDto> {
    try {
      // Verify category exists
      const category = await this.prisma.category.findUnique({
        where: { id: createCourseDto.categoryId },
      });

      if (!category) {
        throw new BadRequestException('Category not found');
      }

      // Verify instructor if provided
      if (createCourseDto.instructorId) {
        const instructor = await this.prisma.user.findUnique({
          where: { id: createCourseDto.instructorId },
        });

        if (!instructor) {
          throw new BadRequestException('Instructor not found');
        }

        if (instructor.role !== Role.INSTRUCTOR) {
          throw new BadRequestException('User is not an instructor');
        }
      }

      // Create course data with required fields
      const courseData = {
        ...createCourseDto,
        // If no instructorId provided, set it to null (will be assigned later)
        instructorId: createCourseDto.instructorId || null,
        isPublished: false, // New courses are unpublished by default
      };

      // Create course
      const course = await this.prisma.course.create({
        data: courseData,
        include: {
          category: true,
          instructor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          lessons: {
            orderBy: { orderIndex: 'asc' },
          },
          quizzes: true,
          _count: {
            select: {
              lessons: true,
              enrollments: true,
              quizzes: true,
            },
          },
        },
      });

      this.logger.log(`Course created: ${course.id} by admin: ${adminId}`);

      return this.transformCourseToResponse(course);
    } catch (error: any) {
      this.logger.error(`Failed to create course: ${error.message}`);
      throw error;
    }
  }

  async findAll(
    query: CourseQueryDto,
    userRole: Role,
    userId?: string,
  ): Promise<{
    courses: CourseResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 10,
      search,
      categoryId,
      level,
      instructorId,
      isPublished,
    } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Role-based filtering
    if (userRole === Role.STUDENT) {
      where.isPublished = true;
    }

    // Query filters
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (level) {
      where.level = level;
    }

    if (instructorId) {
      where.instructorId = instructorId;
    }

    if (isPublished !== undefined) {
      where.isPublished = isPublished;
    }

    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        include: {
          category: true,
          instructor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: {
              lessons: true,
              enrollments: true,
              quizzes: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.course.count({ where }),
    ]);

    const transformedCourses = courses.map((course) =>
      this.transformCourseToResponse(course),
    );

    return {
      courses: transformedCourses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(
    id: string,
    userRole: Role,
    userId?: string,
  ): Promise<CourseResponseDto> {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        category: true,
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        lessons: {
          orderBy: { orderIndex: 'asc' },
          where: userRole === Role.STUDENT ? { isPublished: true } : {},
        },
        quizzes: {
          where: userRole === Role.STUDENT ? { isPublished: true } : {},
        },
        _count: {
          select: {
            lessons: true,
            enrollments: true,
            quizzes: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Check access permissions
    if (userRole === Role.STUDENT && !course.isPublished) {
      throw new ForbiddenException('Course is not published');
    }

    if (userRole === Role.INSTRUCTOR && course.instructorId !== userId) {
      throw new ForbiddenException('You can only access your own courses');
    }

    return this.transformCourseToResponse(course);
  }

  async update(
    id: string,
    updateCourseDto: UpdateCourseDto,
    userRole: Role,
    userId: string,
  ): Promise<CourseResponseDto> {
    const course = await this.findOne(id, userRole, userId);

    // Check permissions
    if (userRole === Role.INSTRUCTOR && course.instructorId !== userId) {
      throw new ForbiddenException('You can only update your own courses');
    }

    // Verify category if provided
    if (updateCourseDto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateCourseDto.categoryId },
      });

      if (!category) {
        throw new BadRequestException('Category not found');
      }
    }

    const updatedCourse = await this.prisma.course.update({
      where: { id },
      data: updateCourseDto,
      include: {
        category: true,
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        lessons: {
          orderBy: { orderIndex: 'asc' },
        },
        quizzes: true,
        _count: {
          select: {
            lessons: true,
            enrollments: true,
            quizzes: true,
          },
        },
      },
    });

    this.logger.log(`Course updated: ${id} by user: ${userId}`);

    return this.transformCourseToResponse(updatedCourse);
  }

  async assignInstructor(
    id: string,
    assignInstructorDto: AssignInstructorDto,
    adminId: string,
  ): Promise<CourseResponseDto> {
    // Verify course exists
    const course = await this.prisma.course.findUnique({
      where: { id },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Verify instructor exists and has correct role
    const instructor = await this.prisma.user.findUnique({
      where: { id: assignInstructorDto.instructorId },
    });

    if (!instructor) {
      throw new NotFoundException('Instructor not found');
    }

    if (instructor.role !== Role.INSTRUCTOR) {
      throw new BadRequestException('User is not an instructor');
    }

    const updatedCourse = await this.prisma.course.update({
      where: { id },
      data: {
        instructorId: assignInstructorDto.instructorId,
      },
      include: {
        category: true,
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        lessons: {
          orderBy: { orderIndex: 'asc' },
        },
        quizzes: true,
        _count: {
          select: {
            lessons: true,
            enrollments: true,
            quizzes: true,
          },
        },
      },
    });

    // Send notification email to instructor
    try {
      await this.emailService.sendCourseEnrollmentEmail(
        instructor.email,
        `${instructor.firstName} ${instructor.lastName}`,
        'Admin',
        'admin@skillspark.com',
        course.title,
        new Date().toLocaleDateString(),
        '8 weeks',
      );
    } catch (error: any) {
      this.logger.error(`Failed to send email notification: ${error.message}`);
    }

    this.logger.log(
      `Instructor assigned to course: ${id} by admin: ${adminId}`,
    );

    return this.transformCourseToResponse(updatedCourse);
  }

  async publish(
    id: string,
    userRole: Role,
    userId: string,
  ): Promise<CourseResponseDto> {
    const course = await this.findOne(id, userRole, userId);

    // Check permissions
    if (userRole === Role.INSTRUCTOR && course.instructorId !== userId) {
      throw new ForbiddenException('You can only publish your own courses');
    }

    // Verify course has content before publishing
    const lessonsCount = await this.prisma.lesson.count({
      where: { courseId: id, isPublished: true },
    });

    if (lessonsCount === 0) {
      throw new BadRequestException(
        'Course must have at least one published lesson before publishing',
      );
    }

    const publishedCourse = await this.prisma.course.update({
      where: { id },
      data: { isPublished: true },
      include: {
        category: true,
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        lessons: {
          orderBy: { orderIndex: 'asc' },
        },
        quizzes: true,
        _count: {
          select: {
            lessons: true,
            enrollments: true,
            quizzes: true,
          },
        },
      },
    });

    this.logger.log(`Course published: ${id} by user: ${userId}`);

    return this.transformCourseToResponse(publishedCourse);
  }

  async unpublish(
    id: string,
    userRole: Role,
    userId: string,
  ): Promise<CourseResponseDto> {
    const course = await this.findOne(id, userRole, userId);

    // Check permissions
    if (userRole === Role.INSTRUCTOR && course.instructorId !== userId) {
      throw new ForbiddenException('You can only unpublish your own courses');
    }

    // Check if course has enrolled students
    const enrollmentsCount = await this.prisma.enrollment.count({
      where: { courseId: id, status: 'ACTIVE' },
    });

    if (enrollmentsCount > 0) {
      throw new BadRequestException(
        'Cannot unpublish course with active enrollments',
      );
    }

    const unpublishedCourse = await this.prisma.course.update({
      where: { id },
      data: { isPublished: false },
      include: {
        category: true,
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        lessons: {
          orderBy: { orderIndex: 'asc' },
        },
        quizzes: true,
        _count: {
          select: {
            lessons: true,
            enrollments: true,
            quizzes: true,
          },
        },
      },
    });

    this.logger.log(`Course unpublished: ${id} by user: ${userId}`);

    return this.transformCourseToResponse(unpublishedCourse);
  }

  async remove(id: string, adminId: string): Promise<void> {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course._count.enrollments > 0) {
      throw new BadRequestException(
        'Cannot delete course with existing enrollments',
      );
    }

    await this.prisma.course.delete({
      where: { id },
    });

    this.logger.log(`Course deleted: ${id} by admin: ${adminId}`);
  }

  async getMyCourses(
    instructorId: string,
    query: CourseQueryDto,
  ): Promise<{
    courses: CourseResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where = {
      instructorId,
    };

    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        include: {
          category: true,
          instructor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          lessons: {
            orderBy: { orderIndex: 'asc' },
          },
          quizzes: true,
          _count: {
            select: {
              lessons: true,
              enrollments: true,
              quizzes: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.course.count({ where }),
    ]);

    const transformedCourses = courses.map((course) =>
      this.transformCourseToResponse(course),
    );

    return {
      courses: transformedCourses,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async uploadCourseThumbnail(
    courseId: string,
    file: Express.Multer.File,
    userRole: Role,
    userId: string,
  ): Promise<CourseResponseDto> {
    const course = await this.findOne(courseId, userRole, userId);

    // Check permissions
    if (userRole === Role.INSTRUCTOR && course.instructorId !== userId) {
      throw new ForbiddenException(
        'You can only upload thumbnails for your own courses',
      );
    }

    // Upload to Cloudinary
    const uploadResult = await this.cloudinaryService.uploadImage(
      file,
      'course-thumbnails',
    );

    if (!uploadResult.success) {
      throw new InternalServerErrorException(
        uploadResult.error || 'Failed to upload thumbnail',
      );
    }

    // Delete old thumbnail if exists
    if (course.thumbnail) {
      try {
        const publicId = course.thumbnail.split('/').pop()?.split('.')[0];
        if (publicId) {
          await this.cloudinaryService.deleteFile(publicId);
        }
      } catch (error: any) {
        this.logger.error(`Failed to delete old thumbnail: ${error.message}`);
      }
    }

    // Update course with new thumbnail
    const updatedCourse = await this.prisma.course.update({
      where: { id: courseId },
      data: {
        thumbnail: uploadResult.data?.secure_url,
      },
      include: {
        category: true,
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        lessons: {
          orderBy: { orderIndex: 'asc' },
        },
        quizzes: true,
        _count: {
          select: {
            lessons: true,
            enrollments: true,
            quizzes: true,
          },
        },
      },
    });

    this.logger.log(`Course thumbnail updated: ${courseId} by user: ${userId}`);

    return this.transformCourseToResponse(updatedCourse);
  }
}
