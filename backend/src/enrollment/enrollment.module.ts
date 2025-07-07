import { Module } from '@nestjs/common';
import { EnrollmentService } from './enrollment.service';
import { EnrollmentController } from './enrollment.controller';
import { ProgressController } from '../progress/progress.controller';
import { PrismaService } from '../prisma/prisma.service';
import { ApiResponseService } from '../shared/api-rensponse.service';
import { ProgressService } from 'src/progress/progress.service';
import { EmailService } from 'src/shared/email/email.service';
import { CourseService } from 'src/course/course.service';
import { LessonService } from 'src/lesson/lesson.service';
import { CloudinaryService } from 'src/shared/cloudinary/cloudinary.service';

@Module({
  controllers: [EnrollmentController, ProgressController],
  providers: [
    EnrollmentService,
    PrismaService,
    ApiResponseService,
    ProgressService,
    EmailService,
    CourseService,
    LessonService,
    CloudinaryService,
  ],
  exports: [EnrollmentService],
})
export class EnrollmentModule {}
