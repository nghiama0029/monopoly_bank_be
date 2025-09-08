// ------------------------
// dto/user.dto.ts
// ------------------------
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UserDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsEmail()
  @MaxLength(100)
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  // @IsEnum(UserRole)
  // role: UserRole;
}
