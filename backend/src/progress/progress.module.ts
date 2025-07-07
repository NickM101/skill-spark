import { Module } from '@nestjs/common';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';
import { ScheduleModule } from '@nestjs/schedule';
import { EmailService } from 'src/shared/email/email.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [ScheduleModule.forRoot(), ConfigModule],
  controllers: [ProgressController],
  providers: [ProgressService, EmailService, PrismaService, ConfigService],
  exports: [ProgressService],
import { EnrollmentModule } from '../enrollment/enrollment.module';
import { ApiResponseService } from '../shared/api-rensponse.service';

@Module({
  imports: [EnrollmentModule],
  controllers: [ProgressController],
  providers: [ProgressService, ApiResponseService],
})
export class ProgressModule {}
