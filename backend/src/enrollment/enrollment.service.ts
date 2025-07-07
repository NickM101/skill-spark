/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { EnrollmentResponseDto } from './dto/enrollment-response.dto';
import { Role, EnrollmentStatus } from '../../generated/prisma';

@Injectable()
export class EnrollmentService {
  private readonly logger = new Logger(EnrollmentService.name);

  constructor(private prisma: PrismaService) {}

  async create(
    createEnrollmentDto: CreateEnrollmentDto,
    userId: string,
  ): Promise<EnrollmentResponseDto> {
    try {
      // Check if course exists and is published
      const course = await this.prisma.course.findUnique({
        where: { id: createEnrollmentDto.courseId },
        include: { instructor: true },
      });

      if (!course) {
        throw new NotFoundException('Course not found');
      }

      if (!course.isPublished) {
        throw new BadRequestException('Cannot enroll in unpublished course');
      }

      // Check if user is trying to enroll in their own course
      if (course.instructorId === userId) {
        throw new BadRequestException(
          'Instructors cannot enroll in their own courses',
        );
      }

      // Check if already enrolled
      const existingEnrollment = await this.prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId: createEnrollmentDto.courseId,
          },
        },
      });

      if (existingEnrollment) {
        throw new BadRequestException('Already enrolled in this course');
      }

      const enrollment = await this.prisma.enrollment.create({
        data: {
          userId,
          courseId: createEnrollmentDto.courseId,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
              description: true,
              thumbnail: true,
              instructor: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      this.logger.log(
        `User ${userId} enrolled in course ${createEnrollmentDto.courseId}`,
      );
      return enrollment;
    } catch (error: any) {
      this.logger.error(`Failed to create enrollment: ${error.message}`);
      throw error;
    }
  }

  async findAll(
    page: number,
    limit: number,
    userRole: Role,
    userId: string,
    courseId?: string,
    status?: string,
  ): Promise<{
    enrollments: EnrollmentResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;
    const where: any = {};

    // Role-based filtering
    if (userRole === Role.STUDENT) {
      where.userId = userId;
    } else if (userRole === Role.INSTRUCTOR) {
      where.course = {
        instructorId: userId,
      };
    }

    // Query filters
    if (courseId) {
      where.courseId = courseId;
    }

    if (status) {
      where.status = status as EnrollmentStatus;
    }

    const [enrollments, total] = await Promise.all([
      this.prisma.enrollment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
              description: true,
              thumbnail: true,
              instructor: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { enrolledAt: 'desc' },
      }),
      this.prisma.enrollment.count({ where }),
    ]);

    return {
      enrollments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getMyEnrollments(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{
    enrollments: EnrollmentResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [enrollments, total] = await Promise.all([
      this.prisma.enrollment.findMany({
        where: { userId },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              description: true,
              thumbnail: true,
              instructor: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { enrolledAt: 'desc' },
      }),
      this.prisma.enrollment.count({ where: { userId } }),
    ]);

    return {
      enrollments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getCourseEnrollments(
    courseId: string,
    page: number,
    limit: number,
    userRole: Role,
    userId: string,
  ): Promise<{
    enrollments: EnrollmentResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // Verify access permissions
    if (userRole === Role.INSTRUCTOR) {
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!course || course.instructorId !== userId) {
        throw new ForbiddenException(
          'You can only view enrollments for your own courses',
        );
      }
    }

    const skip = (page - 1) * limit;

    const [enrollments, total] = await Promise.all([
      this.prisma.enrollment.findMany({
        where: { courseId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { enrolledAt: 'desc' },
      }),
      this.prisma.enrollment.count({ where: { courseId } }),
    ]);

    return {
      enrollments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(
    id: string,
    userRole: Role,
    userId: string,
  ): Promise<EnrollmentResponseDto> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            thumbnail: true,
            instructor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    // Check access permissions
    if (userRole === Role.STUDENT && enrollment.userId !== userId) {
      throw new ForbiddenException('You can only access your own enrollments');
    }

    if (
      userRole === Role.INSTRUCTOR &&
      enrollment.course.instructor?.id !== userId
    ) {
      throw new ForbiddenException(
        'You can only access enrollments for your own courses',
      );
    }

    return enrollment;
  }

  async getProgress(
    enrollmentId: string,
    userRole: Role,
    userId: string,
  ): Promise<any> {
    const enrollment = await this.findOne(enrollmentId, userRole, userId);

    const progress = await this.prisma.progress.findMany({
      where: { enrollmentId },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            orderIndex: true,
          },
        },
      },
      orderBy: { lesson: { orderIndex: 'asc' } },
    });

    const totalLessons = await this.prisma.lesson.count({
      where: { courseId: enrollment.courseId, isPublished: true },
    });

    const completedLessons = progress.filter((p) => p.isCompleted).length;
    const progressPercent =
      totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    return {
      enrollment,
      totalLessons,
      completedLessons,
      progressPercent,
      lessons: progress,
    };
  }

  async update(
    id: string,
    updateEnrollmentDto: UpdateEnrollmentDto,
    userRole: Role,
    userId: string,
  ): Promise<EnrollmentResponseDto> {
    const enrollment = await this.findOne(id, userRole, userId);

    // Only admin can update enrollment status
    if (userRole !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can update enrollment status');
    }

    const updatedEnrollment = await this.prisma.enrollment.update({
      where: { id },
      data: {
        ...updateEnrollmentDto,
        completedAt:
          updateEnrollmentDto.status === EnrollmentStatus.COMPLETED
            ? new Date()
            : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            thumbnail: true,
            instructor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    this.logger.log(`Enrollment updated: ${id}`);
    return updatedEnrollment;
  }

  async remove(id: string, userRole: Role, userId: string): Promise<void> {
    const enrollment = await this.findOne(id, userRole, userId);

    // Students can drop their own enrollment, admins can remove any
    if (userRole === Role.STUDENT && enrollment.userId !== userId) {
      throw new ForbiddenException('You can only drop your own enrollments');
    }

    if (userRole === Role.INSTRUCTOR) {
      throw new ForbiddenException('Instructors cannot remove enrollments');
    }

    await this.prisma.enrollment.delete({
      where: { id },
    });

    this.logger.log(`Enrollment removed: ${id}`);
  }

  async markLessonComplete(lessonId: string, userId: string): Promise<any> {
    // Find the enrollment for this lesson's course
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: lesson.courseId,
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    // Create or update progress record
    const progress = await this.prisma.progress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
      update: {
        isCompleted: true,
        completedAt: new Date(),
      },
      create: {
        userId,
        courseId: lesson.courseId,
        lessonId,
        enrollmentId: enrollment.id,
        isCompleted: true,
        completedAt: new Date(),
      },
    });

    // Update enrollment progress percentage
    const totalLessons = await this.prisma.lesson.count({
      where: { courseId: lesson.courseId, isPublished: true },
    });

    const completedLessons = await this.prisma.progress.count({
      where: {
        userId,
        courseId: lesson.courseId,
        isCompleted: true,
      },
    });

    const progressPercent =
      totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

    await this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        progressPercent,
        status:
          progressPercent === 100
            ? EnrollmentStatus.COMPLETED
            : EnrollmentStatus.ACTIVE,
        completedAt: progressPercent === 100 ? new Date() : null,
      },
    });

    this.logger.log(`Lesson ${lessonId} marked complete for user ${userId}`);
    return progress;
  }
}
