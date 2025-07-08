import {
  IsNotEmpty,
  IsString,
  IsInt,
  Min,
  Max,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateQuizDto {
  @IsNotEmpty({ message: 'Quiz title is required' })
  @IsString({ message: 'Quiz title must be a string' })
  @MinLength(3, { message: 'Quiz title must be at least 3 characters' })
  @MaxLength(100, { message: 'Quiz title must be at most 100 characters' })
  title: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @MaxLength(500, { message: 'Description must be at most 500 characters' })
  description?: string;

  @IsOptional()
  @IsInt({ message: 'Time limit must be an integer' })
  @Min(1, { message: 'Time limit must be at least 1 minute' })
  @Max(180, { message: 'Time limit must be at most 180 minutes' })
  timeLimit?: number;

  @IsNotEmpty({ message: 'Passing score is required' })
  @IsInt({ message: 'Passing score must be an integer' })
  @Min(0, { message: 'Passing score cannot be negative' })
  @Max(100, { message: 'Passing score must be at most 100%' })
  passingScore: number;
}
