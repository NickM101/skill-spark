/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { Role } from '../../generated/prisma';

@Injectable()
export class LessonService {
  private readonly logger = new Logger(LessonService.name);

  constructor(private prisma: PrismaService) {}

  async create(
    courseId: string,
    createLessonDto: CreateLessonDto,
    userRole: Role,
    userId: string,
  ) {
    // Verify course exists and user has permission
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (userRole === Role.INSTRUCTOR && course.instructorId !== userId) {
      throw new ForbiddenException(
        'You can only create lessons for your own courses',
      );
    }

    const lesson = await this.prisma.lesson.create({
      data: {
        ...createLessonDto,
        courseId,
      },
    });

    this.logger.log(`Lesson created: ${lesson.id} for course: ${courseId}`);
    return lesson;
  }

  async findAll(
    courseId: string,
    userRole: Role,
    userId: string,
    isPublished?: boolean,
  ) {
    const where: any = { courseId };

    if (userRole === Role.STUDENT) {
      where.isPublished = true;
    }

    if (isPublished !== undefined) {
      where.isPublished = isPublished;
    }

    return this.prisma.lesson.findMany({
      where,
      orderBy: { orderIndex: 'asc' },
    });
  }

  async findOne(courseId: string, id: string, userRole: Role, userId: string) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id, courseId },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    if (userRole === Role.STUDENT && !lesson.isPublished) {
      throw new ForbiddenException('Lesson is not published');
    }

    return lesson;
  }

  async update(
    courseId: string,
    id: string,
    updateLessonDto: UpdateLessonDto,
    userRole: Role,
    userId: string,
  ) {
    const lesson = await this.findOne(courseId, id, userRole, userId);

    // Check permissions
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (userRole === Role.INSTRUCTOR && course?.instructorId !== userId) {
      throw new ForbiddenException(
        'You can only update lessons for your own courses',
      );
    }

    const updatedLesson = await this.prisma.lesson.update({
      where: { id },
      data: updateLessonDto,
    });

    this.logger.log(`Lesson updated: ${id}`);
    return updatedLesson;
  }

  async publish(courseId: string, id: string, userRole: Role, userId: string) {
    const lesson = await this.findOne(courseId, id, userRole, userId);

    // Check permissions
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (userRole === Role.INSTRUCTOR && course?.instructorId !== userId) {
      throw new ForbiddenException(
        'You can only publish lessons for your own courses',
      );
    }

    if (userRole === Role.STUDENT) {
      throw new ForbiddenException('Students cannot publish lessons');
    }

    // Validate lesson has required content before publishing
    if (!lesson.title || lesson.title.trim() === '') {
      throw new BadRequestException(
        'Lesson must have a title before publishing',
      );
    }

    if (!lesson.content && !lesson.videoUrl && !lesson.fileUrl) {
      throw new BadRequestException(
        'Lesson must have content, video URL, or file URL before publishing',
      );
    }

    const publishedLesson = await this.prisma.lesson.update({
      where: { id },
      data: { isPublished: true },
    });

    this.logger.log(`Lesson published: ${id} for course: ${courseId}`);
    return publishedLesson;
  }

  async unpublish(
    courseId: string,
    id: string,
    userRole: Role,
    userId: string,
  ) {
    const lesson = await this.findOne(courseId, id, userRole, userId);

    // Check permissions
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (userRole === Role.INSTRUCTOR && course?.instructorId !== userId) {
      throw new ForbiddenException(
        'You can only unpublish lessons for your own courses',
      );
    }

    if (userRole === Role.STUDENT) {
      throw new ForbiddenException('Students cannot unpublish lessons');
    }

    // Check if course is published and this is the only published lesson
    if (course?.isPublished) {
      const publishedLessonsCount = await this.prisma.lesson.count({
        where: {
          courseId,
          isPublished: true,
        },
      });

      if (publishedLessonsCount === 1 && lesson.isPublished) {
        throw new BadRequestException(
          'Cannot unpublish the last published lesson of a published course. Unpublish the course first.',
        );
      }
    }

    const unpublishedLesson = await this.prisma.lesson.update({
      where: { id },
      data: { isPublished: false },
    });

    this.logger.log(`Lesson unpublished: ${id} for course: ${courseId}`);
    return unpublishedLesson;
  }

  async publishAll(courseId: string, userRole: Role, userId: string) {
    // Check permissions
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (userRole === Role.INSTRUCTOR && course.instructorId !== userId) {
      throw new ForbiddenException(
        'You can only publish lessons for your own courses',
      );
    }

    if (userRole === Role.STUDENT) {
      throw new ForbiddenException('Students cannot publish lessons');
    }

    // Get all unpublished lessons
    const unpublishedLessons = await this.prisma.lesson.findMany({
      where: {
        courseId,
        isPublished: false,
      },
    });

    if (unpublishedLessons.length === 0) {
      throw new BadRequestException(
        'No unpublished lessons found for this course',
      );
    }

    // Validate all lessons have required content
    const invalidLessons = unpublishedLessons.filter(
      (lesson) =>
        !lesson.title ||
        lesson.title.trim() === '' ||
        (!lesson.content && !lesson.videoUrl && !lesson.fileUrl),
    );

    if (invalidLessons.length > 0) {
      throw new BadRequestException(
        `The following lessons need content before publishing: ${invalidLessons.map((l) => l.title).join(', ')}`,
      );
    }

    // Publish all lessons
    const result = await this.prisma.lesson.updateMany({
      where: {
        courseId,
        isPublished: false,
      },
      data: { isPublished: true },
    });

    this.logger.log(
      `${result.count} lessons published for course: ${courseId}`,
    );

    // Return updated lessons
    return this.prisma.lesson.findMany({
      where: { courseId },
      orderBy: { orderIndex: 'asc' },
    });
  }

  async remove(courseId: string, id: string, userRole: Role, userId: string) {
    const lesson = await this.findOne(courseId, id, userRole, userId);

    // Check permissions
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (userRole === Role.INSTRUCTOR && course?.instructorId !== userId) {
      throw new ForbiddenException(
        'You can only delete lessons for your own courses',
      );
    }

    // Check if this is the last published lesson in a published course
    if (course?.isPublished && lesson.isPublished) {
      const publishedLessonsCount = await this.prisma.lesson.count({
        where: {
          courseId,
          isPublished: true,
        },
      });

      if (publishedLessonsCount === 1) {
        throw new BadRequestException(
          'Cannot delete the last published lesson of a published course. Unpublish the course first.',
        );
      }
    }

    await this.prisma.lesson.delete({
      where: { id },
    });

    this.logger.log(`Lesson deleted: ${id} from course: ${courseId}`);
  }

  async reorderLessons(
    courseId: string,
    lessonIds: string[],
    userRole: Role,
    userId: string,
  ) {
    // Check permissions
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (userRole === Role.INSTRUCTOR && course.instructorId !== userId) {
      throw new ForbiddenException(
        'You can only reorder lessons for your own courses',
      );
    }

    // Verify all lesson IDs belong to this course
    const lessons = await this.prisma.lesson.findMany({
      where: {
        id: { in: lessonIds },
        courseId,
      },
    });

    if (lessons.length !== lessonIds.length) {
      throw new BadRequestException(
        'Some lesson IDs are invalid or do not belong to this course',
      );
    }

    // Update order indices
    const updatePromises = lessonIds.map((lessonId, index) =>
      this.prisma.lesson.update({
        where: { id: lessonId },
        data: { orderIndex: index + 1 },
      }),
    );

    const updatedLessons = await Promise.all(updatePromises);

    this.logger.log(
      `${lessonIds.length} lessons reordered for course: ${courseId}`,
    );
    return updatedLessons;
  }

  async getLessonStats(courseId: string, userRole: Role, userId: string) {
    // Check permissions
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (userRole === Role.INSTRUCTOR && course.instructorId !== userId) {
      throw new ForbiddenException(
        'You can only view lesson stats for your own courses',
      );
    }

    const [totalLessons, publishedLessons, unpublishedLessons] =
      await Promise.all([
        this.prisma.lesson.count({ where: { courseId } }),
        this.prisma.lesson.count({ where: { courseId, isPublished: true } }),
        this.prisma.lesson.count({ where: { courseId, isPublished: false } }),
      ]);

    return {
      totalLessons,
      publishedLessons,
      unpublishedLessons,
      publishedPercentage:
        totalLessons > 0 ? (publishedLessons / totalLessons) * 100 : 0,
    };
  }
}
