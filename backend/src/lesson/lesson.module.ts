import { Module } from '@nestjs/common';
import { LessonService } from './lesson.service';
import { LessonController } from './lesson.controller';
import { PrismaService } from '../prisma/prisma.service';
import { ApiResponseService } from '../shared/api-rensponse.service';

@Module({
  controllers: [LessonController],
  providers: [LessonService, PrismaService, ApiResponseService],
  exports: [LessonService],
})
export class LessonModule {}
