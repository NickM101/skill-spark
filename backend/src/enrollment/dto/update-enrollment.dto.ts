import { IsEnum, IsOptional } from 'class-validator';
import { EnrollmentStatus } from '../../../generated/prisma';

export class UpdateEnrollmentDto {
  @IsOptional()
  @IsEnum(EnrollmentStatus)
  status?: EnrollmentStatus;
}
