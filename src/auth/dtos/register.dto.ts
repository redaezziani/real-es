import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty({
    message: 'يجب ألا يكون الاسم فارغًا',
  })
  name: string;

  @IsEmail(
    {},
    {
      message: 'عنوان البريد الإلكتروني غير صالح',
    },
  )
  email: string;

  @MinLength(6, {
    message: 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل',
  })
  password: string;
}
