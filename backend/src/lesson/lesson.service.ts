import {
  Injectable,
  NotFoundException,
  ForbiddenException,
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

    return this.prisma.lesson.create({
      data: {
        ...createLessonDto,
        courseId,
      },
    });
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

    return this.prisma.lesson.update({
      where: { id },
      data: updateLessonDto,
    });
  }

  async remove(courseId: string, id: string, userRole: Role, userId: string) {
    await this.findOne(courseId, id, userRole, userId);

    // Check permissions
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (userRole === Role.INSTRUCTOR && course?.instructorId !== userId) {
      throw new ForbiddenException(
        'You can only delete lessons for your own courses',
      );
    }

    await this.prisma.lesson.delete({
      where: { id },
    });
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

    // Update order indices
    const updatePromises = lessonIds.map((lessonId, index) =>
      this.prisma.lesson.update({
        where: { id: lessonId },
        data: { orderIndex: index + 1 },
      }),
    );

    return Promise.all(updatePromises);
  }
}
