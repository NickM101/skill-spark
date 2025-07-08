import { IsNotEmpty, IsUUID } from 'class-validator';

export class MarkProgressDto {
  @IsNotEmpty()
  @IsUUID()
  lessonId: string;
}
