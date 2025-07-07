import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EmailService } from './shared/email/email.service';
import { CloudinaryService } from './shared/cloudinary/cloudinary.service';
import { CourseModule } from './course/course.module';
import { LessonModule } from './lesson/lesson.module';
import { CategoryModule } from './category/category.module';
import { EnrollmentModule } from './enrollment/enrollment.module';
import { ProgressModule } from './progress/progress.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
    UsersModule,
    CourseModule,
    LessonModule,
    CategoryModule,
    EnrollmentModule,
    ProgressModule,
  ],
  controllers: [AppController],
  providers: [AppService, EmailService, CloudinaryService],
})
export class AppModule {}
