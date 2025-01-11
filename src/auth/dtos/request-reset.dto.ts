import { IsEmail, IsNotEmpty } from 'class-validator';

export class RequestResetDto {
  @IsEmail({}, { message: 'عنوان البريد الإلكتروني غير صالح' })
  @IsNotEmpty({ message: 'يجب ألا يكون البريد الإلكتروني فارغًا' })
  email: string;
}
