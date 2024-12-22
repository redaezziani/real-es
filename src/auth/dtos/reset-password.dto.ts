import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString({ message: 'Invalid reset token' })
  @IsNotEmpty({ message: 'Reset token should not be empty' })
  resetToken: string;

  @IsString({ message: 'Invalid new password' })
  @IsNotEmpty({ message: 'New password should not be empty' })
  @MinLength(6, {
    message: 'Password must be at least 6 characters long',
  })
  newPassword: string;
}
