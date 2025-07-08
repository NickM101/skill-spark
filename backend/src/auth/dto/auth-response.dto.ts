export class UserResponseDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isVerified: boolean;
  createdAt: Date;
}

export class LoginResponseDto {
  user: UserResponseDto;
  token: string;
}

export class RegisterResponseDto {
  user: UserResponseDto;
  message: string;
}
