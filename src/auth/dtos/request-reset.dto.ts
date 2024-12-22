import { IsEmail, IsNotEmpty } from 'class-validator';

export class RequestResetDto {
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email should not be empty' })
  email: string;
}
