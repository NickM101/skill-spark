import {
  IsNotEmpty,
  IsString,
  MinLength,
  IsEmail,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { Role } from '../../../generated/prisma';

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  firstName: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  lastName: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;

  // Make confirmPassword optional since it's validated in frontend
  @IsOptional()
  @IsString()
  confirmPassword?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
