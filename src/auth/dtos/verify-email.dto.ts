import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({
    description: "The verification token sent to the user's email",
    example: '123456',
  })
  @IsString({ message: 'Invalid verification token' })
  @IsNotEmpty({ message: 'Verification token should not be empty' })
  verificationToken: string;
}
