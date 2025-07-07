import { Module } from '@nestjs/common';
import { EnrollmentService } from './enrollment.service';
import { EnrollmentController } from './enrollment.controller';
import { ProgressController } from '../progress/progress.controller';
import { PrismaService } from '../prisma/prisma.service';
import { ApiResponseService } from '../shared/api-rensponse.service';

@Module({
  controllers: [EnrollmentController, ProgressController],
  providers: [EnrollmentService, PrismaService, ApiResponseService],
  exports: [EnrollmentService],
})
export class EnrollmentModule {}
