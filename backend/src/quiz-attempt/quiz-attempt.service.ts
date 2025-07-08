import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { QuizSubmissionDto } from './dto/quiz-submission.dto';
import { AttemptStatsDto, UserAttemptDto } from './dto/attempts-stats.dto';
import { $Enums } from 'generated/prisma';
import { JsonValue } from 'generated/prisma/runtime/library';

@Injectable()
export class QuizAttemptService {
  private readonly logger = new Logger(QuizAttemptService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Start a new quiz attempt
   */
  async startAttempt(userId: string, quizId: string) {
    // Verify quiz exists and is published
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        course: true,
        questions: {
          select: {
            id: true,
            points: true,
          },
        },
      },
    });

    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${quizId} not found`);
    }

    if (!quiz.isPublished) {
      throw new BadRequestException('Quiz is not published yet');
    }

    // Check if user is enrolled in the course
    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        userId,
        courseId: quiz.courseId,
        status: 'ACTIVE',
      },
    });

    if (!enrollment) {
      throw new ForbiddenException(
        'You must be enrolled in this course to take quizzes',
      );
    }

    // Check if user has an active attempt
    const activeAttempt = await this.prisma.quizAttempt.findFirst({
      where: {
        userId,
        quizId,
        status: 'IN_PROGRESS',
      },
    });

    if (activeAttempt) {
      // Check if attempt has exceeded time limit
      if (quiz.timeLimit) {
        const timeElapsed = Date.now() - activeAttempt.startedAt.getTime();
        const timeLimit = quiz.timeLimit * 60 * 1000; // Convert minutes to milliseconds

        if (timeElapsed > timeLimit) {
          // Auto-submit the expired attempt
          await this.submitQuiz(activeAttempt.id, userId);
          throw new BadRequestException(
            'Previous attempt has expired. Please start a new attempt.',
          );
        }
      }

      return {
        ...activeAttempt,
        timeRemaining: quiz.timeLimit
          ? quiz.timeLimit * 60 -
            Math.floor((Date.now() - activeAttempt.startedAt.getTime()) / 1000)
          : null,
      };
    }

    // Calculate max score
    const maxScore = quiz.questions.reduce(
      (total, question) => total + question.points,
      0,
    );

    // Create new attempt
    const attempt = await this.prisma.quizAttempt.create({
      data: {
        userId,
        quizId,
        maxScore,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
      include: {
        quiz: {
          select: {
            title: true,
            timeLimit: true,
            questions: {
              orderBy: {
                orderIndex: 'asc',
              },
              select: {
                id: true,
                question: true,
                type: true,
                options: true,
                points: true,
                orderIndex: true,
              },
            },
          },
        },
      },
    });

    return {
      ...attempt,
      timeRemaining: quiz.timeLimit ? quiz.timeLimit * 60 : null,
    };
  }

  /**
   * Find user's attempts for a specific quiz
   */
  async findUserAttempts(
    userId: string,
    quizId: string,
  ): Promise<UserAttemptDto[]> {
    // Verify quiz exists
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
    });

    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${quizId} not found`);
    }

    // Check if user is enrolled
    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        userId,
        courseId: quiz.courseId,
        status: 'ACTIVE',
      },
    });

    if (!enrollment) {
      throw new ForbiddenException(
        'You must be enrolled in this course to view attempts',
      );
    }

    const attempts = await this.prisma.quizAttempt.findMany({
      where: {
        userId,
        quizId,
      },
      include: {
        answers: {
          select: {
            questionId: true,
            answer: true,
            isCorrect: true,
            pointsEarned: true,
          },
        },
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    return attempts.map((attempt) => ({
      id: attempt.id,
      score: attempt.score,
      maxScore: attempt.maxScore,
      isPassed: attempt.isPassed,
      status: attempt.status,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      completionTime: attempt.submittedAt
        ? Math.floor(
            (attempt.submittedAt.getTime() - attempt.startedAt.getTime()) /
              1000,
          )
        : null,
      answers: attempt.answers,
    }));
  }

  /**
   * Find specific attempt details
   */
  async findAttempt(id: string, userId: string) {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id },
      include: {
        quiz: {
          include: {
            questions: {
              orderBy: {
                orderIndex: 'asc',
              },
            },
          },
        },
        answers: true,
      },
    });

    if (!attempt) {
      throw new NotFoundException(`Attempt with ID ${id} not found`);
    }

    // Check if user owns this attempt
    if (attempt.userId !== userId) {
      throw new ForbiddenException('You can only view your own attempts');
    }

    // Check if attempt has expired
    if (attempt.status === 'IN_PROGRESS' && attempt.quiz.timeLimit) {
      const timeElapsed = Date.now() - attempt.startedAt.getTime();
      const timeLimit = attempt.quiz.timeLimit * 60 * 1000;

      if (timeElapsed > timeLimit) {
        await this.submitQuiz(attempt.id, userId);
        throw new BadRequestException(
          'This attempt has expired and was automatically submitted',
        );
      }
    }

    return {
      ...attempt,
      timeRemaining:
        attempt.quiz.timeLimit && attempt.status === 'IN_PROGRESS'
          ? attempt.quiz.timeLimit * 60 -
            Math.floor((Date.now() - attempt.startedAt.getTime()) / 1000)
          : null,
    };
  }

  /**
   * Submit an answer for a question
   */
  async submitAnswer(
    attemptId: string,
    userId: string,
    submitAnswerDto: SubmitAnswerDto,
  ) {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            questions: true,
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException(`Attempt with ID ${attemptId} not found`);
    }

    if (attempt.userId !== userId) {
      throw new ForbiddenException(
        'You can only submit answers for your own attempts',
      );
    }

    if (attempt.status !== 'IN_PROGRESS') {
      throw new BadRequestException(
        'Cannot submit answers for a completed attempt',
      );
    }

    // Check if attempt has expired
    if (attempt.quiz.timeLimit) {
      const timeElapsed = Date.now() - attempt.startedAt.getTime();
      const timeLimit = attempt.quiz.timeLimit * 60 * 1000;

      if (timeElapsed > timeLimit) {
        await this.submitQuiz(attemptId, userId);
        throw new BadRequestException(
          'Time limit exceeded. Quiz has been automatically submitted.',
        );
      }
    }

    // Find the question
    const question = attempt.quiz.questions.find(
      (q) => q.id === submitAnswerDto.questionId,
    );
    if (!question) {
      throw new NotFoundException(
        `Question with ID ${submitAnswerDto.questionId} not found in this quiz`,
      );
    }

    // Check if answer already exists
    const existingAnswer = await this.prisma.answer.findFirst({
      where: {
        attemptId,
        questionId: submitAnswerDto.questionId,
      },
    });

    // Grade the answer
    const { isCorrect, pointsEarned } = this.gradeAnswer(
      question,
      submitAnswerDto.answer,
    );

    if (existingAnswer) {
      // Update existing answer
      return this.prisma.answer.update({
        where: { id: existingAnswer.id },
        data: {
          answer: submitAnswerDto.answer,
          isCorrect,
          pointsEarned,
        },
      });
    } else {
      // Create new answer
      return this.prisma.answer.create({
        data: {
          attemptId,
          questionId: submitAnswerDto.questionId,
          answer: submitAnswerDto.answer,
          isCorrect,
          pointsEarned,
        },
      });
    }
  }

  /**
   * Submit the entire quiz
   */
  async submitQuiz(
    attemptId: string,
    userId: string,
  ): Promise<QuizSubmissionDto> {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            questions: true,
          },
        },
        answers: true,
      },
    });

    if (!attempt) {
      throw new NotFoundException(`Attempt with ID ${attemptId} not found`);
    }

    if (attempt.userId !== userId) {
      throw new ForbiddenException('You can only submit your own attempts');
    }

    if (attempt.status !== 'IN_PROGRESS') {
      throw new BadRequestException('This attempt has already been submitted');
    }

    // Calculate final score
    const totalScore = attempt.answers.reduce(
      (sum, answer) => sum + answer.pointsEarned,
      0,
    );
    const scorePercentage =
      attempt.maxScore > 0
        ? Math.round((totalScore / attempt.maxScore) * 100)
        : 0;
    const isPassed = scorePercentage >= attempt.quiz.passingScore;

    const submittedAt = new Date();
    const completionTime = Math.floor(
      (submittedAt.getTime() - attempt.startedAt.getTime()) / 1000,
    );

    // Update attempt
    const updatedAttempt = await this.prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        score: scorePercentage,
        isPassed,
        submittedAt,
        status: 'SUBMITTED',
      },
    });

    return {
      attemptId: updatedAttempt.id,
      score: scorePercentage,
      maxScore: attempt.maxScore,
      isPassed,
      completionTime,
      submittedAt,
      gradedAt: submittedAt,
    };
  }

  /**
   * Grade a quiz attempt (for manual grading if needed)
   */
  async gradeAttempt(attemptId: string, userId: string) {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: {
        quiz: {
          include: {
            questions: true,
            course: true,
          },
        },
        answers: true,
      },
    });

    if (!attempt) {
      throw new NotFoundException(`Attempt with ID ${attemptId} not found`);
    }

    // Check if user is the instructor
    if (attempt.quiz.course.instructorId !== userId) {
      throw new ForbiddenException(
        'Only the course instructor can grade attempts',
      );
    }

    // Re-grade all answers
    const gradedAnswers = await Promise.all(
      attempt.answers.map(async (answer) => {
        const question = attempt.quiz.questions.find(
          (q) => q.id === answer.questionId,
        );
        if (!question) return answer;

        // Convert answer.answer (JsonValue | null) to string or string[] or fallback to empty string
        let userAnswer: string | string[];
        if (Array.isArray(answer.answer)) {
          userAnswer = answer.answer.map(String);
        } else if (
          typeof answer.answer === 'string' ||
          typeof answer.answer === 'number' ||
          typeof answer.answer === 'boolean'
        ) {
          userAnswer = String(answer.answer);
        } else {
          userAnswer = '';
        }
        const { isCorrect, pointsEarned } = this.gradeAnswer(
          question,
          userAnswer,
        );

        return this.prisma.answer.update({
          where: { id: answer.id },
          data: { isCorrect, pointsEarned },
        });
      }),
    );

    // Recalculate score
    const totalScore = gradedAnswers.reduce(
      (sum, answer) => sum + answer.pointsEarned,
      0,
    );
    const scorePercentage =
      attempt.maxScore > 0
        ? Math.round((totalScore / attempt.maxScore) * 100)
        : 0;
    const isPassed = scorePercentage >= attempt.quiz.passingScore;

    return this.prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        score: scorePercentage,
        isPassed,
        status: 'GRADED',
      },
    });
  }

  /**
   * Get quiz attempt statistics
   */
  async getAttemptStats(
    quizId: string,
    userId: string,
  ): Promise<AttemptStatsDto> {
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        course: true,
      },
    });

    if (!quiz) {
      throw new NotFoundException(`Quiz with ID ${quizId} not found`);
    }

    // Check if user is the instructor
    if (quiz.course.instructorId !== userId) {
      throw new ForbiddenException(
        'Only the course instructor can view attempt statistics',
      );
    }

    const attempts = await this.prisma.quizAttempt.findMany({
      where: { quizId },
      orderBy: { startedAt: 'desc' },
    });

    const completedAttempts = attempts.filter(
      (a) => a.status === 'SUBMITTED' || a.status === 'GRADED',
    );
    const inProgressAttempts = attempts.filter(
      (a) => a.status === 'IN_PROGRESS',
    );

    let averageScore = 0;
    let highestScore = 0;
    let lowestScore = 100;
    let passCount = 0;
    let totalCompletionTime = 0;

    if (completedAttempts.length > 0) {
      const scores = completedAttempts.map((a) => a.score || 0);
      averageScore =
        scores.reduce((sum, score) => sum + score, 0) / scores.length;
      highestScore = Math.max(...scores);
      lowestScore = Math.min(...scores);
      passCount = completedAttempts.filter((a) => a.isPassed).length;

      completedAttempts.forEach((attempt) => {
        if (attempt.submittedAt) {
          const completionTime =
            (attempt.submittedAt.getTime() - attempt.startedAt.getTime()) /
            1000;
          totalCompletionTime += completionTime;
        }
      });
    }

    const passRate =
      completedAttempts.length > 0
        ? (passCount / completedAttempts.length) * 100
        : 0;
    const averageCompletionTime =
      completedAttempts.length > 0
        ? totalCompletionTime / completedAttempts.length
        : 0;

    // Group attempts by day for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentAttempts = attempts.filter((a) => a.startedAt >= thirtyDaysAgo);
    const attemptsByDay = this.groupAttemptsByDay(recentAttempts);

    return {
      quizId,
      quizTitle: quiz.title,
      totalAttempts: attempts.length,
      completedAttempts: completedAttempts.length,
      inProgressAttempts: inProgressAttempts.length,
      averageScore,
      highestScore,
      lowestScore,
      passRate,
      averageCompletionTime,
      attemptsByDay,
    };
  }

  /**
   * Group attempts by day
   */
  private groupAttemptsByDay(
    attempts: { startedAt: Date }[],
  ): { date: string; count: number }[] {
    const groups = attempts.reduce<Record<string, number>>((acc, attempt) => {
      const date =
        attempt.startedAt instanceof Date
          ? attempt.startedAt.toISOString().split('T')[0]
          : new Date(attempt.startedAt).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(groups).map(([date, count]) => ({
      date,
      count: Number(count),
    }));
  }

  /**
   * Grade an individual answer
   * Accepts a question object (with correctAnswers as JsonValue) and a user answer.
   */
  private gradeAnswer(
    question: {
      id: string;
      quizId: string;
      createdAt: Date;
      updatedAt: Date;
      correctAnswers: JsonValue;
      type: $Enums.QuestionType;
      points: number;
      question: string;
      options: JsonValue | null;
      orderIndex: number;
    },
    userAnswer: string | string[],
  ): { isCorrect: boolean; pointsEarned: number } {
    // Parse correctAnswers from JsonValue to string[]
    let correctAnswers: string[] = [];
    if (Array.isArray(question.correctAnswers)) {
      correctAnswers = question.correctAnswers.map(String);
    } else if (typeof question.correctAnswers === 'string') {
      correctAnswers = [question.correctAnswers];
    }

    let isCorrect = false;

    if (question.type === 'MULTIPLE_CHOICE') {
      if (Array.isArray(userAnswer)) {
        // Multi-select: all answers must match
        const userSet = new Set(userAnswer.map(String));
        const correctSet = new Set(correctAnswers);
        isCorrect =
          userSet.size === correctSet.size &&
          [...userSet].every((ans) => correctSet.has(ans));
      } else {
        // Single select
        isCorrect = correctAnswers.includes(String(userAnswer));
      }
    } else if (question.type === 'TRUE_FALSE') {
      isCorrect = correctAnswers.includes(String(userAnswer));
    } else {
      // For other types, fallback to strict equality
      isCorrect = correctAnswers.includes(String(userAnswer));
    }

    return {
      isCorrect,
      pointsEarned: isCorrect ? question.points : 0,
    };
  }
}
