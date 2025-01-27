import { IsEmail, IsArray, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSubscriptionDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: ['manga', 'chapters'], required: false })
  @IsArray()
  @IsOptional()
  topics?: string[];
}
