import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsDate,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { Role } from '../../../generated/prisma';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsString()
  verificationCode?: string;

  @IsOptional()
  @IsDate()
  verificationExpires?: Date;
  isEmailVerified: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
