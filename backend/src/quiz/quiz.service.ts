/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { AddQuestionDto } from './dto/add-question.dto';
import { QuizStatsDto } from './dto/question-stats.dto';

@Injectable()
export class QuizService {
  private readonly logger = new Logger(QuizService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create a new quiz for a course
   */
  async create(courseId: string, userId: string, createQuizDto: CreateQuizDto) {
    // Verify the course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    // Check if user is the course instructor
    if (course.instructorId !== userId) {
      throw new ForbiddenException(
        'Only the course instructor can create quizzes',
      );
    }

    // Create the quiz
    return this.prisma.quiz.create({
      data: {
        ...createQuizDto,
        courseId,
        isPublished: false,
      },
    });
  }

  /**
   * Add a question to a quiz
   */
  async addQuestion(
    quizId: string,
    userId: string,
    addQuestionDto: AddQuestionDto,
  ) {
    // Verify quiz exists and user is authorized
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        course: {
          select: {
            instructorId: true,
          },
        },
        questions: {
          select: {
            orderIndex: true,
          },
          orderBy: {
            orderIndex: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${quizId} not found`);
    }

    // Check if user is the course instructor
    if (quiz.course.instructorId !== userId) {
      throw new ForbiddenException(
        'Only the course instructor can add questions to quizzes',
      );
    }

    // Prevent adding questions to published quizzes
    if (quiz.isPublished) {
      throw new BadRequestException(
        'Cannot add questions to a published quiz. Unpublish it first.',
      );
    }

    // Validate question type and options
    this.validateQuestionData(addQuestionDto);

    // Determine the order index
    const orderIndex =
      addQuestionDto.orderIndex !== undefined
        ? addQuestionDto.orderIndex
        : (quiz.questions[0]?.orderIndex || 0) + 1;

    // Create the question
    const question = await this.prisma.question.create({
      data: {
        quizId,
        question: addQuestionDto.question,
        type: addQuestionDto.type as import('../../generated/prisma').$Enums.QuestionType,
        options: addQuestionDto.options ?? [],
        correctAnswers: Array.isArray(addQuestionDto.correctAnswers)
          ? addQuestionDto.correctAnswers
          : [],
        points: addQuestionDto.points,
        orderIndex,
      },
    });

    this.logger.log(`Question added to quiz ${quizId} by user ${userId}`);

    return question;
  }

  /**
   * Validate question data based on type
   */
  private validateQuestionData(addQuestionDto: AddQuestionDto) {
    const { type, options, correctAnswers } = addQuestionDto;
    // Use the Prisma enum for type comparison
    const QuestionType = require('../../generated/prisma').$Enums.QuestionType;

    switch (type) {
      case QuestionType.MULTIPLE_CHOICE:
        if (!options || options.length < 2) {
          throw new BadRequestException(
            'Multiple choice questions must have at least 2 options',
          );
        }
        if (!correctAnswers || correctAnswers.length === 0) {
          throw new BadRequestException(
            'Multiple choice questions must have at least one correct answer',
          );
        }
        // Validate that correct answers are valid indices
        correctAnswers.forEach((answer) => {
          if (
            typeof answer === 'number' &&
            (answer < 0 || (options && answer >= options.length))
          ) {
            throw new BadRequestException(
              'Correct answer indices must be valid option indices',
            );
          }
        });
        break;

      case QuestionType.TRUE_FALSE:
        if (!options || options.length !== 2) {
          throw new BadRequestException(
            'True/False questions must have exactly 2 options',
          );
        }
        if (!correctAnswers || correctAnswers.length !== 1) {
          throw new BadRequestException(
            'True/False questions must have exactly one correct answer',
          );
        }
        break;

      case QuestionType.SHORT_ANSWER:
        if (!correctAnswers || correctAnswers.length === 0) {
          throw new BadRequestException(
            'Short answer questions must have at least one correct answer',
          );
        }
        break;

      case QuestionType.ESSAY:
        // Essay questions don't need validation of correct answers
        break;

      default:
        throw new BadRequestException('Invalid question type');
    }
  }

  /**
   * Find all quizzes for a course
   */
  async findAllByCourse(courseId: string, userId: string) {
    // Verify the course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    // Check if user is authorized (instructor or enrolled student)
    const isInstructor = course.instructorId === userId;

    if (!isInstructor) {
      const enrollment = await this.prisma.enrollment.findFirst({
        where: {
          userId,
          courseId,
          status: 'ACTIVE',
        },
      });

      if (!enrollment) {
        throw new ForbiddenException(
          'You must be enrolled in this course to view quizzes',
        );
      }
    }

    // Query parameters based on user role
    const whereClause = isInstructor
      ? { courseId } // Instructors can see all quizzes
      : { courseId, isPublished: true }; // Students can only see published quizzes

    return this.prisma.quiz.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: {
            questions: true,
          },
        },
      },
    });
  }

  /**
   * Find a quiz by ID
   */
  async findOne(id: string, userId: string) {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            instructorId: true,
          },
        },
        questions: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }

    // Check if user is authorized (instructor or enrolled student)
    const isInstructor = quiz.course.instructorId === userId;

    if (!isInstructor) {
      // Check if quiz is published
      if (!quiz.isPublished) {
        throw new ForbiddenException('This quiz is not yet published');
      }

      // Check if student is enrolled
      const enrollment = await this.prisma.enrollment.findFirst({
        where: {
          userId,
          courseId: quiz.courseId,
          status: 'ACTIVE',
        },
      });

      if (!enrollment) {
        throw new ForbiddenException(
          'You must be enrolled in this course to view quizzes',
        );
      }

      // For students, don't return correct answers
      quiz.questions = quiz.questions.map((question) => ({
        ...question,
        correctAnswers: null,
      }));
    }

    return quiz;
  }

  /**
   * Update a quiz
   */
  async update(id: string, userId: string, updateQuizDto: UpdateQuizDto) {
    // Verify quiz exists and user is authorized
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            instructorId: true,
          },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }

    // Check if user is the course instructor
    if (quiz.course.instructorId !== userId) {
      throw new ForbiddenException(
        'Only the course instructor can update quizzes',
      );
    }

    // Prevent updating published quizzes
    if (quiz.isPublished) {
      throw new BadRequestException(
        'Cannot update a published quiz. Unpublish it first.',
      );
    }

    // Update the quiz
    return this.prisma.quiz.update({
      where: { id },
      data: updateQuizDto,
    });
  }

  /**
   * Remove a quiz
   */
  async remove(id: string, userId: string) {
    // Verify quiz exists and user is authorized
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            instructorId: true,
          },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }

    // Check if user is the course instructor
    if (quiz.course.instructorId !== userId) {
      throw new ForbiddenException(
        'Only the course instructor can delete quizzes',
      );
    }

    // Check if there are any quiz attempts
    const attemptCount = await this.prisma.quizAttempt.count({
      where: { quizId: id },
    });

    if (attemptCount > 0) {
      throw new BadRequestException(
        `Cannot delete quiz with ${attemptCount} attempts. Consider unpublishing instead.`,
      );
    }

    // Delete the quiz
    await this.prisma.quiz.delete({
      where: { id },
    });

    return { id, message: 'Quiz deleted successfully' };
  }

  /**
   * Publish a quiz
   */
  async publish(id: string, userId: string) {
    // Verify quiz exists and user is authorized
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            instructorId: true,
          },
        },
        _count: {
          select: {
            questions: true,
          },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }

    // Check if user is the course instructor
    if (quiz.course.instructorId !== userId) {
      throw new ForbiddenException(
        'Only the course instructor can publish quizzes',
      );
    }

    // Check if quiz has questions
    if (quiz._count.questions === 0) {
      throw new BadRequestException('Cannot publish a quiz without questions');
    }

    // Publish the quiz
    return this.prisma.quiz.update({
      where: { id },
      data: {
        isPublished: true,
      },
    });
  }

  /**
   * Unpublish a quiz
   */
  async unpublish(id: string, userId: string) {
    // Verify quiz exists and user is authorized
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            instructorId: true,
          },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }

    // Check if user is the course instructor
    if (quiz.course.instructorId !== userId) {
      throw new ForbiddenException(
        'Only the course instructor can unpublish quizzes',
      );
    }

    // Unpublish the quiz
    return this.prisma.quiz.update({
      where: { id },
      data: {
        isPublished: false,
      },
    });
  }

  /**
   * Get quiz statistics
   */
  async getQuizStats(id: string, userId: string): Promise<QuizStatsDto> {
    // Verify quiz exists and user is authorized
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            instructorId: true,
          },
        },
        questions: true,
      },
    });

    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${id} not found`);
    }

    // Check if user is the course instructor
    if (quiz.course.instructorId !== userId) {
      throw new ForbiddenException(
        'Only the course instructor can view quiz statistics',
      );
    }

    // Get all quiz attempts
    const attempts = await this.prisma.quizAttempt.findMany({
      where: { quizId: id, status: 'SUBMITTED' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        answers: {
          include: {
            question: true,
          },
        },
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });

    if (attempts.length === 0) {
      // Return empty statistics if no attempts
      return {
        quizId: id,
        quizTitle: quiz.title,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        passRate: 0,
        totalAttempts: 0,
        averageCompletionTime: 0,
        questionStats: [],
        recentAttempts: [],
      };
    }

    // Calculate aggregate statistics
    let totalScore = 0;
    let highestScore = 0;
    let lowestScore = 100;
    let passCount = 0;
    let totalCompletionTime = 0;

    // Define a type for question statistics
    type QuestionStat = {
      questionId: string;
      questionText: string;
      correctAnswerCount: number;
      totalAnswerCount: number;
    };

    // Process question statistics
    const questionMap = new Map<string, QuestionStat>();
    quiz.questions.forEach((question) => {
      questionMap.set(question.id, {
        questionId: question.id,
        questionText: question.question,
        correctAnswerCount: 0,
        totalAnswerCount: 0,
      });
    });

    // Process student performances and update statistics
    const recentAttempts = attempts.slice(0, 10).map((attempt) => {
      const score = attempt.score || 0;

      // Update aggregate stats
      totalScore += score;
      highestScore = Math.max(highestScore, score);
      lowestScore = Math.min(lowestScore, score);
      if (score >= quiz.passingScore) {
        passCount++;
      }

      // Calculate completion time in minutes
      const completionTime =
        attempt.submittedAt && attempt.startedAt
          ? (attempt.submittedAt.getTime() - attempt.startedAt.getTime()) /
            60000
          : quiz.timeLimit || 0;

      totalCompletionTime += completionTime;

      // Process question statistics
      attempt.answers.forEach((answer) => {
        const questionStat = questionMap.get(answer.questionId);
        if (questionStat) {
          questionStat.totalAnswerCount++;
          if (answer.isCorrect) {
            questionStat.correctAnswerCount++;
          }
        }
      });

      // Return student performance data
      return {
        userId: attempt.user.id,
        fullName: `${attempt.user.firstName} ${attempt.user.lastName}`,
        score,
        passed: score >= quiz.passingScore,
        completionTime,
        attemptDate: attempt.submittedAt || attempt.startedAt,
      };
    });

    // Calculate final stats
    const totalAttempts = attempts.length;
    const averageScore = totalScore / totalAttempts;
    const passRate = (passCount / totalAttempts) * 100;
    const averageCompletionTime = totalCompletionTime / totalAttempts;

    // Format question stats
    const questionStats = Array.from(questionMap.values()).map(
      (stat: QuestionStat) => ({
        questionId: stat.questionId,
        questionText: stat.questionText,
        correctAnswerRate:
          stat.totalAnswerCount > 0
            ? (stat.correctAnswerCount / stat.totalAnswerCount) * 100
            : 0,
        timesAnswered: stat.totalAnswerCount,
      }),
    );

    return {
      quizId: id,
      quizTitle: quiz.title,
      averageScore,
      highestScore,
      lowestScore,
      passRate,
      totalAttempts,
      averageCompletionTime,
      questionStats,
      recentAttempts,
    };
  }
}
