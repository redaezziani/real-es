import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProfileDto {
  @ApiProperty({
    description: 'The user ID of the profile owner',
    example: '123456',
  })
  @IsString({ message: 'Invalid user ID' })
  @IsNotEmpty({ message: 'User ID should not be empty' })
  userId: string;

  @ApiProperty({
    description: 'The bio of the user',
    example: 'I am a software developer',
  })
  @IsString({ message: 'Invalid bio' })
  @IsOptional()
  bio: string;

  @ApiProperty({
    description: 'The phone number of the user',
    example: '08012345678',
  })
  @IsString({ message: 'Invalid phone number' })
  @IsOptional()
  phone: string;
}
