import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../shared/email/email.service';
import { CourseProgressDto } from './dto/course-progress.dto';
import { ProgressStatsDto } from './dto/progress-stats.dto';
import { StudentProgressDto } from './dto/student-progress.dto';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ProgressService {
  private readonly logger = new Logger(ProgressService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  /**
   * Mark a lesson as completed by a user
   */
  async markLessonComplete(userId: string, lessonId: string): Promise<void> {
    // Verify the lesson exists
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { course: true },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    // Verify user is enrolled in the course
    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        userId,
        courseId: lesson.courseId,
        status: 'ACTIVE',
      },
    });

    if (!enrollment) {
      throw new ForbiddenException(
        'You must be enrolled in this course to track progress',
      );
    }

    // Check if progress already exists
    const existingProgress = await this.prisma.progress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId,
        },
      },
    });

    if (existingProgress) {
      // Already marked as complete, nothing to do
      return;
    }

    // Create progress record
    await this.prisma.progress.create({
      data: {
        userId,
        lessonId,
        completed: true,
      },
    });

    // Update enrollment progress percentage
    await this.updateEnrollmentProgress(userId, lesson.courseId);

    // Check if course is completed
    await this.checkCourseCompletion(userId, lesson.courseId);
  }

  /**
   * Mark a lesson as incomplete by a user
   */
  async markLessonIncomplete(userId: string, lessonId: string): Promise<void> {
    // Verify the lesson exists
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { course: true },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    // Verify user is enrolled in the course
    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        userId,
        courseId: lesson.courseId,
        status: 'ACTIVE',
      },
    });

    if (!enrollment) {
      throw new ForbiddenException(
        'You must be enrolled in this course to track progress',
      );
    }

    // Delete progress record if exists
    await this.prisma.progress.deleteMany({
      where: {
        userId,
        lessonId,
      },
    });

    // Update enrollment progress percentage
    await this.updateEnrollmentProgress(userId, lesson.courseId);
  }

  /**
   * Get a user's progress for a specific course
   */
  async getUserProgress(
    userId: string,
    courseId: string,
  ): Promise<CourseProgressDto> {
    // Verify user is enrolled in the course
    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        userId,
        courseId,
      },
    });

    if (!enrollment) {
      throw new ForbiddenException('You are not enrolled in this course');
    }

    // Get course with lessons
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        lessons: true,
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Get completed lessons
    const completedLessons = await this.prisma.progress.findMany({
      where: {
        userId,
        lesson: {
          courseId,
        },
      },
      orderBy: {
        completedAt: 'desc',
      },
    });

    const totalLessons = course.lessons.length;
    const completedCount = completedLessons.length;
    const progressPercentage =
      totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

    const lastActivity =
      completedLessons.length > 0 ? completedLessons[0].completedAt : undefined;

    return {
      courseId,
      courseName: course.title,
      totalLessons,
      completedLessons: completedCount,
      progressPercentage,
      lastActivity,
      remainingLessons: totalLessons - completedCount,
    };
  }

  /**
   * Get all students' progress for a specific course
   */
  async getCourseProgress(courseId: string): Promise<StudentProgressDto[]> {
    // Verify course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        lessons: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const totalLessons = course.lessons.length;

    // Get all enrollments for the course
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        courseId,
        status: 'ACTIVE',
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
      },
    });

    // Get progress for each enrolled student
    const studentsProgress: StudentProgressDto[] = await Promise.all(
      enrollments.map(async (enrollment) => {
        const completedLessons = await this.prisma.progress.findMany({
          where: {
            userId: enrollment.userId,
            lesson: {
              courseId,
            },
          },
          orderBy: {
            completedAt: 'desc',
          },
        });

        const completedCount = completedLessons.length;
        const progressPercentage =
          totalLessons > 0
            ? Math.round((completedCount / totalLessons) * 100)
            : 0;

        const lastActivity =
          completedLessons.length > 0
            ? completedLessons[0].completedAt
            : undefined;

        return {
          userId: enrollment.user.id,
          fullName: `${enrollment.user.firstName} ${enrollment.user.lastName}`,
          email: enrollment.user.email,
          progressPercentage,
          completedLessons: completedCount,
          totalLessons,
          lastActivity,
        };
      }),
    );

    return studentsProgress.sort(
      (a, b) => b.progressPercentage - a.progressPercentage,
    );
  }

  /**
   * Calculate a user's progress percentage for a course
   */
  async calculateCourseProgress(
    userId: string,
    courseId: string,
  ): Promise<number> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        lessons: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const totalLessons = course.lessons.length;

    if (totalLessons === 0) {
      return 0;
    }

    const completedLessons = await this.prisma.progress.count({
      where: {
        userId,
        lesson: {
          courseId,
        },
      },
    });

    return Math.round((completedLessons / totalLessons) * 100);
  }

  /**
   * Get overall progress statistics for a user
   */
  async getProgressStats(userId: string): Promise<ProgressStatsDto> {
    // Get all active enrollments
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      include: {
        course: {
          include: {
            lessons: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (enrollments.length === 0) {
      return {
        totalCoursesEnrolled: 0,
        totalCoursesCompleted: 0,
        totalLessonsCompleted: 0,
        averageCourseCompletion: 0,
        courseProgress: [],
      };
    }

    // Get all progress records for the user
    const progressRecords = await this.prisma.progress.findMany({
      where: {
        userId,
      },
      include: {
        lesson: {
          select: {
            courseId: true,
          },
        },
      },
    });

    // Calculate stats
    let totalLessonsCompleted = progressRecords.length;
    let totalCourseCompletionPercentage = 0;
    let totalCoursesCompleted = 0;

    const courseProgress: CourseProgressDto[] = await Promise.all(
      enrollments.map(async (enrollment) => {
        const courseId = enrollment.courseId;
        const course = enrollment.course;
        const totalLessons = course.lessons.length;

        const completedLessons = progressRecords.filter(
          (progress) => progress.lesson.courseId === courseId,
        ).length;

        const progressPercentage =
          totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100)
            : 0;

        totalCourseCompletionPercentage += progressPercentage;

        if (progressPercentage === 100) {
          totalCoursesCompleted++;
        }

        // Get last activity
        const lastProgress = await this.prisma.progress.findFirst({
          where: {
            userId,
            lesson: {
              courseId,
            },
          },
          orderBy: {
            completedAt: 'desc',
          },
        });

        return {
          courseId,
          courseName: course.title,
          totalLessons,
          completedLessons,
          progressPercentage,
          lastActivity: lastProgress?.completedAt,
          remainingLessons: totalLessons - completedLessons,
        };
      }),
    );

    const averageCourseCompletion = enrollments.length > 0
      ? Math.round(totalCourseCompletionPercentage / enrollments.length)
      : 0;

    return {
      totalCoursesEnrolled: enrollments.length,
      totalCoursesCompleted,
      totalLessonsCompleted,
      averageCourseCompletion,
      courseProgress: courseProgress.sort((a, b) => b.progressPercentage - a.progressPercentage),
    };
  }

  /**
   * Update the progress percentage on an enrollment
   */
  private async updateEnrollmentProgress(
    userId: string,
    courseId: string,
  ): Promise<void> {
    try {
      const progressPercentage = await this.calculateCourseProgress(userId, courseId);

      await this.prisma.enrollment.updateMany({
        where: {
          userId,
          courseId,
        },
        data: {
          progressPercentage,
        },
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`Failed to update enrollment progress: ${error.message}`);
      } else {
        this.logger.error('Failed to update enrollment progress: Unknown error');
      }
    }
  }

  /**
   * Send email notification for lesson completion
   */
  private async sendLessonCompletionEmail(
    userId: string,
    lessonId: string,
  ): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          email: true,
          firstName: true,
          lastName: true,
        },
      });

      const lesson = await this.prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
          course: {
            select: {
              title: true,
            },
          },
        },
      });

      if (!user || !lesson) {
        return;
      }

      const fullName = `${user.firstName} ${user.lastName}`;

      // Get progress for the course
      const courseProgress = await this.getUserProgress(
        userId,
        lesson.courseId,
      );

      await this.emailService.sendLessonCompletionEmail(
        user.email,
        fullName,
        lesson.title,
        lesson.course.title,
        `${courseProgress.progressPercentage}%`,
        `You have completed ${courseProgress.completedLessons} out of ${courseProgress.totalLessons} lessons.`,
      );
    } catch (error) {
      // Log error but don't fail the progress update
      console.error('Failed to send lesson completion email', error);
    }
  }

  /**
   * Check if a course is completed and send notification
   */
  private async checkCourseCompletion(
    userId: string,
    courseId: string,
  ): Promise<void> {
    try {
      const progress = await this.getUserProgress(userId, courseId);

      if (progress.progressPercentage === 100) {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        });

        const course = await this.prisma.course.findUnique({
          where: { id: courseId },
          select: {
            title: true,
          },
        });

        if (!user || !course) {
          return;
        }

        const fullName = `${user.firstName} ${user.lastName}`;

        // Send course completion email
        await this.emailService.sendCourseCompletionEmail(
          user.email,
          fullName,
          course.title,
          'Excellent',
          'Congratulations on completing the course!',
        );

        // Update enrollment status to COMPLETED
        await this.prisma.enrollment.updateMany({
          where: {
            userId,
            courseId,
          },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
          },
        });
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`Failed to process course completion: ${error.message}`);
      } else {
        this.logger.error('Failed to process course completion: Unknown error');
      }
    }
  }

  /**
   * Scheduled job to send reminders for incomplete courses
   * Runs every day at midnight
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async sendCourseReminders(): Promise<void> {
    try {
      // Find enrollments that are:
      // 1. Active (not completed or canceled)
      // 2. Created more than 7 days ago
      // 3. Have progress less than 100%
      // 4. Haven't had a reminder in the last 7 days
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - 7);

      const incompleteEnrollments = await this.prisma.enrollment.findMany({
        where: {
          status: 'ACTIVE',
          createdAt: {
            lt: dateThreshold,
          },
          progressPercentage: {
            lt: 100,
          },
          lastReminderSent: {
            lt: dateThreshold,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
              endDate: true,
            },
          },
        },
      });

      for (const enrollment of incompleteEnrollments) {
        const { user, course } = enrollment;
        const fullName = `${user.firstName} ${user.lastName}`;

        // Calculate days remaining if course has an end date
        let courseEndDate = 'N/A';
        if (course.endDate) {
          courseEndDate = course.endDate.toISOString().split('T')[0];
        }

        // Send reminder email
        await this.emailService.sendCourseReminderEmail(
          user.email,
          fullName,
          course.title,
          courseEndDate,
        );

        // Update last reminder sent date
        await this.prisma.enrollment.update({
          where: {
            id: enrollment.id,
          },
          data: {
            lastReminderSent: new Date(),
          },
        });
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`Failed to send course reminders: ${error.message}`);
      } else {
        this.logger.error('Failed to send course reminders: Unknown error');
      }
    }
  }
}
