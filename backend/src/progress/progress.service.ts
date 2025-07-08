/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../shared/email/email.service';
import { CourseService } from '../course/course.service';
import { EnrollmentService } from '../enrollment/enrollment.service';
import { LessonService } from '../lesson/lesson.service';
import { CourseProgressDto } from './dto/course-progress.dto';
import { ProgressStatsDto } from './dto/progress-stats.dto';
import { StudentProgressDto } from './dto/student-progress.dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Role } from 'generated/prisma';

@Injectable()
export class ProgressService {
  private readonly logger = new Logger(ProgressService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private courseService: CourseService,
    private enrollmentService: EnrollmentService,
    private lessonService: LessonService,
  ) {}

  /**
   * Mark a lesson as completed by a user
   */
  async markLessonComplete(
    userId: string,
    lessonId: string,
    userRole: Role,
    courseId: string,
  ): Promise<void> {
    const lesson = await this.lessonService.findOne(
      courseId,
      lessonId,
      userRole,
      userId,
    );
    if (!lesson) throw new NotFoundException('Lesson not found');

    const enrollment =
      await this.enrollmentService.findEnrollmentByUserAndCourse(
        userId,
        lesson.courseId,
      );
    if (!enrollment || enrollment.status !== 'ACTIVE') {
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
        completedAt: new Date(),
      },
    });

    // Update enrollment progress percentage
    await this.updateEnrollmentProgress(userId, lesson.courseId);

    // Check if course is completed
    await this.checkCourseCompletion(userId, lesson.courseId, userRole);
  }

  /**
   * Mark a lesson as incomplete by a user
   */
  async markLessonIncomplete(
    userId: string,
    lessonId: string,
    courseId: string,
    userRole: Role,
  ): Promise<void> {
    const lesson = await this.lessonService.findOne(
      lessonId,
      courseId,
      userRole,
      userId,
    );
    if (!lesson) throw new NotFoundException('Lesson not found');

    const enrollment =
      await this.enrollmentService.findEnrollmentByUserAndCourse(
        userId,
        lesson.courseId,
      );
    if (!enrollment || enrollment.status !== 'ACTIVE') {
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
    userRole: Role = 'STUDENT',
  ): Promise<CourseProgressDto> {
    // Use EnrollmentService to check enrollment
    const enrollment =
      await this.enrollmentService.findEnrollmentByUserAndCourse(
        userId,
        courseId,
      );
    if (!enrollment) {
      throw new ForbiddenException('You are not enrolled in this course');
    }

    // Use CourseService to get course with lessons
    const course = await this.courseService.findOne(courseId, userRole, userId);
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

    const totalLessons = (course.lessons ?? []).length;
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
  async getCourseProgress(
    courseId: string,
    userRole: Role,
    userId: string,
    page: number,
    limit: number,
  ): Promise<StudentProgressDto[]> {
    // Use CourseService to get course with lessons
    const course = await this.courseService.findOne(courseId, userRole, userId);
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const totalLessons = (course.lessons ?? []).length;

    // Use EnrollmentService to get all enrollments for the course
    const { enrollments } = await this.enrollmentService.getCourseEnrollments(
      courseId,
      userId,
      '', // lessonId is not used here, so pass an empty string or the appropriate value
      page,
      limit,
      userRole,
    );

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

        if (!enrollment.user) {
          return {
            userId: enrollment.userId,
            fullName: '',
            email: '',
            progressPercentage,
            completedLessons: completedCount,
            totalLessons,
            lastActivity,
          };
        }
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
    userRole: Role = 'STUDENT',
  ): Promise<number> {
    const course = await this.courseService.findOne(courseId, userRole);
    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const totalLessons = (course.lessons ?? []).length;

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
  async getProgressStats(
    userId: string,
    page: number,
    limit: number,
  ): Promise<ProgressStatsDto> {
    const { enrollments } = await this.enrollmentService.getMyEnrollments(
      userId,
      page,
      limit,
    );

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
    const totalLessonsCompleted = progressRecords.length;
    let totalCourseCompletionPercentage = 0;
    let totalCoursesCompleted = 0;

    const courseProgress: CourseProgressDto[] = await Promise.all(
      enrollments.map(async (enrollment) => {
        const courseId = enrollment.courseId;
        const course = enrollment.course;
        const totalLessons = Array.isArray((course as any)?.lessons)
          ? (course as any).lessons.length
          : 0;

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
          courseName: course?.title ?? '',
          totalLessons,
          completedLessons,
          progressPercentage,
          lastActivity: lastProgress?.completedAt,
          remainingLessons: totalLessons - completedLessons,
        };
      }),
    );

    const averageCourseCompletion =
      enrollments.length > 0
        ? Math.round(totalCourseCompletionPercentage / enrollments.length)
        : 0;

    return {
      totalCoursesEnrolled: enrollments.length,
      totalCoursesCompleted,
      totalLessonsCompleted,
      averageCourseCompletion,
      courseProgress: courseProgress.sort(
        (a, b) => b.progressPercentage - a.progressPercentage,
      ),
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
      const progressPercentage = await this.calculateCourseProgress(
        userId,
        courseId,
      );

      await this.prisma.enrollment.updateMany({
        where: {
          userId,
          courseId,
        },
        data: {
          progressPercent: progressPercentage,
        },
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to update enrollment progress: ${error.message}`,
        );
      } else {
        this.logger.error(
          'Failed to update enrollment progress: Unknown error',
        );
      }
    }
  }

  // /**
  //  * Send email notification for lesson completion
  //  */
  // private async sendLessonCompletionEmail(
  //   userId: string,
  //   lessonId: string,
  //   courseId: string,
  //   userRole: Role,
  // ): Promise<void> {
  //   try {
  //     const user = await this.prisma.user.findUnique({
  //       where: { id: userId },
  //       select: {
  //         email: true,
  //         firstName: true,
  //         lastName: true,
  //       },
  //     });

  //     const lesson = await this.lessonService.findOne(
  //       courseId,
  //       lessonId,
  //       userRole,
  //       userId,
  //     );

  //     if (!user || !lesson) {
  //       return;
  //     }

  //     const fullName = `${user.firstName} ${user.lastName}`;

  //     // Get progress for the course
  //     const courseProgress = await this.getUserProgress(
  //       userId,
  //       lesson.courseId,
  //     );

  //     await this.emailService.sendLessonCompletionEmail(
  //       user.email,
  //       fullName,
  //       lesson.title,
  //       lesson.course.title,
  //       `${courseProgress.progressPercentage}%`,
  //       `You have completed ${courseProgress.completedLessons} out of ${courseProgress.totalLessons} lessons.`,
  //     );
  //   } catch (error) {
  //     // Log error but don't fail the progress update
  //     this.logger.error('Failed to send lesson completion email', error);
  //   }
  // }

  /**
   * Check if a course is completed and send notification
   */
  private async checkCourseCompletion(
    userId: string,
    courseId: string,
    userRole: Role,
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

        const course = await this.courseService.findOne(
          courseId,
          userRole,
          userId,
        );

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
        this.logger.error(
          `Failed to process course completion: ${error.message}`,
        );
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
      // 2. Enrolled more than 7 days ago
      // 3. Have progressPercent less than 100%
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - 7);

      // Only fetch enrollments with status ACTIVE, enrolledAt older than 7 days, and progressPercent < 100
      const incompleteEnrollments = await this.prisma.enrollment.findMany({
        where: {
          status: 'ACTIVE',
          enrolledAt: {
            lt: dateThreshold,
          },
          progressPercent: {
            lt: 100,
          },
        },
      });

      for (const enrollment of incompleteEnrollments) {
        // Fetch user and course info for this enrollment
        const user = await this.prisma.user.findUnique({
          where: { id: enrollment.userId },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        });

        const course = await this.prisma.course.findUnique({
          where: { id: enrollment.courseId },
          select: {
            id: true,
            title: true,
            // Remove endDate if not present in your schema
          },
        });

        if (!user || !course) continue;

        const fullName = `${user.firstName} ${user.lastName}`;

        // If you have an endDate field in your course model, fetch it above and use it here
        const courseEndDate = 'N/A';
        // Uncomment below if endDate exists in your schema
        // if (course.endDate) {
        //   courseEndDate = course.endDate.toISOString().split('T')[0];
        // }

        // Send reminder email
        await this.emailService.sendCourseReminderEmail(
          user.email,
          fullName,
          course.title,
          courseEndDate,
        );

        // If you have a lastReminderSent field in your enrollment model, update it here
        // await this.prisma.enrollment.update({
        //   where: {
        //     id: enrollment.id,
        //   },
        //   data: {
        //     lastReminderSent: new Date(),
        //   },
        // });
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
