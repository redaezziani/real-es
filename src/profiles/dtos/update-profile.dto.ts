import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({
    required: false,
    description: 'User biography',
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({
    required: false,
    description: 'User phone number',
  })
  @IsOptional()
  @IsString()
  phone?: string;
}

// Create a separate DTO for file uploads
export class UpdateProfileImageDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Profile image file (jpeg/png)',
    required: true,
  })
  file: any;
}
