import { IsUUID, IsNotEmpty } from 'class-validator';

export class AssignInstructorDto {
  @IsUUID()
  @IsNotEmpty()
  instructorId: string;
}
