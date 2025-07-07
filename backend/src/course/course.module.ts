import { Module } from '@nestjs/common';
import { CourseService } from './course.service';
import { CourseController } from './course.controller';
import { PrismaService } from '../prisma/prisma.service';
import { CloudinaryService } from '../shared/cloudinary/cloudinary.service';
import { EmailService } from '../shared/email/email.service';
import { ApiResponseService } from '../shared/api-rensponse.service';

@Module({
  controllers: [CourseController],
  providers: [
    CourseService,
    PrismaService,
    CloudinaryService,
    EmailService,
    ApiResponseService,
  ],
  exports: [CourseService],
})
export class CourseModule {}
