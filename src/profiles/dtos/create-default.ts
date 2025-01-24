import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDefaultProfileDto {
  @ApiProperty({
    description: 'The user ID of the profile owner',
    example: '123456',
  })
  @IsString({ message: 'Invalid user ID' })
  @IsNotEmpty({ message: 'User ID should not be empty' })
  userId: string;
}
