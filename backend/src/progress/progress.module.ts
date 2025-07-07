import { Module } from '@nestjs/common';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';
import { ScheduleModule } from '@nestjs/schedule';
import { EmailService } from 'src/shared/email/email.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EnrollmentModule } from 'src/enrollment/enrollment.module';
import { EnrollmentService } from 'src/enrollment/enrollment.service';
import { LessonService } from 'src/lesson/lesson.service';
import { CourseService } from 'src/course/course.service';
import { CloudinaryService } from 'src/shared/cloudinary/cloudinary.service';
import { ApiResponseService } from 'src/shared/api-rensponse.service';

@Module({
  imports: [ScheduleModule.forRoot(), ConfigModule, EnrollmentModule],
  controllers: [ProgressController],
  providers: [
    ProgressService,
    EmailService,
    PrismaService,
    ConfigService,
    EnrollmentService,
    LessonService,
    CourseService,
    CloudinaryService,
    ApiResponseService,
  ],
  exports: [ProgressService, CourseService],
})
export class ProgressModule {}
