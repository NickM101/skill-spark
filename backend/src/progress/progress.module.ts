import { Module } from '@nestjs/common';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';
import { EnrollmentModule } from '../enrollment/enrollment.module';
import { ApiResponseService } from '../shared/api-rensponse.service';

@Module({
  imports: [EnrollmentModule],
  controllers: [ProgressController],
  providers: [ProgressService, ApiResponseService],
})
export class ProgressModule {}
