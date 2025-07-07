/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  IsNotEmpty,
  IsString,
  IsUUID,
  IsArray,
  ValidateIf,
} from 'class-validator';

export class SubmitAnswerDto {
  @IsNotEmpty({ message: 'Question ID is required' })
  @IsUUID('4', { message: 'Question ID must be a valid UUID' })
  questionId: string;

  @IsNotEmpty({ message: 'Answer is required' })
  @ValidateIf((o) => Array.isArray(o.answer))
  @IsArray({ message: 'Answer must be an array for multiple choice questions' })
  @ValidateIf((o) => !Array.isArray(o.answer))
  @IsString({ message: 'Answer must be a string for true/false questions' })
  answer: string | string[];
}
