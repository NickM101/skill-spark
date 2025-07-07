import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
  IsBoolean,
  IsUrl,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { LessonType } from '../../../generated/prisma';

export class CreateLessonDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsEnum(LessonType)
  type?: LessonType;

  @IsOptional()
  @IsUrl()
  videoUrl?: string;

  @IsOptional()
  @IsUrl()
  fileUrl?: string;

  @IsNotEmpty()
  @IsInt()
  @Transform(({ value }: { value: string }) => parseInt(value))
  orderIndex: number;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
