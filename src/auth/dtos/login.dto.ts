import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    type: String,
  })
  @IsEmail({}, { message: 'عنوان البريد الإلكتروني غير صالح' })
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'strongPassword123',
    type: String,
    minLength: 8,
  })
  @IsNotEmpty({ message: 'يجب ألا تكون كلمة المرور فارغة' })
  @IsString({ message: 'يجب أن تكون كلمة المرور نصية' })
  @MinLength(8, { message: 'يجب أن تتكون كلمة المرور من 8 أحرف على الأقل' })
  password: string;
}
