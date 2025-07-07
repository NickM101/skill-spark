/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsNumber,
  IsEnum,
  Min,
  Max,
  ValidateIf,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
  SHORT_ANSWER = 'SHORT_ANSWER',
  ESSAY = 'ESSAY',
}

export class AddQuestionDto {
  @ApiProperty({
    description: 'The question text',
    example: 'What is the capital of France?',
    minLength: 5,
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  question: string;

  @ApiPropertyOptional({
    description: 'Type of question',
    enum: QuestionType,
    example: QuestionType.MULTIPLE_CHOICE,
    default: QuestionType.MULTIPLE_CHOICE,
  })
  @IsOptional()
  @IsEnum(QuestionType)
  type?: QuestionType;

  @ApiPropertyOptional({
    description:
      'Array of possible answers/options. Required for MULTIPLE_CHOICE and TRUE_FALSE questions. Stored as JSON in database',
    example: ['Paris', 'London', 'Berlin', 'Madrid'],
    isArray: true,
    type: String,
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @Transform(({ value }) => value?.map((option: string) => option?.trim()))
  @ValidateIf(
    (o) =>
      o.type === QuestionType.MULTIPLE_CHOICE ||
      o.type === QuestionType.TRUE_FALSE,
  )
  options?: string[];

  @ApiProperty({
    description:
      'Array of correct answers. Stored as JSON in database. For MULTIPLE_CHOICE: indices (0-based) or text values. For TRUE_FALSE: single index. For SHORT_ANSWER: text values. For ESSAY: optional rubric points',
    example: [0], // Index of correct answer in options array
    isArray: true,
  })
  @IsArray()
  @ValidateIf((o) => o.type !== QuestionType.ESSAY)
  @ArrayMinSize(1)
  correctAnswers: (string | number)[];

  @ApiPropertyOptional({
    description: 'Points awarded for correct answer',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  points?: number;

  @ApiPropertyOptional({
    description:
      'Order index for question arrangement. Auto-generated if not provided',
    example: 1,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  orderIndex?: number;
}
