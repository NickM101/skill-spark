import { Module } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { QuizController } from './quiz.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApiResponseService } from 'src/shared/api-rensponse.service';

@Module({
  providers: [QuizService, PrismaService, ApiResponseService],
  controllers: [QuizController],
})
export class QuizModule {}
