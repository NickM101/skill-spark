import { Module } from '@nestjs/common';
import { QuizAttemptController } from './quiz-attempt.controller';
import { QuizAttemptService } from './quiz-attempt.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApiResponseService } from 'src/shared/api-rensponse.service';

@Module({
  imports: [],
  controllers: [QuizAttemptController],
  providers: [QuizAttemptService, PrismaService, ApiResponseService],
  exports: [QuizAttemptService],
})
export class QuizAttemptModule {}
