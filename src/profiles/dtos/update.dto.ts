//update.dto.ts
import { IsString, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { badge, roles } from '@prisma/client';
export class UpdateProfileParamsDto {
  @ApiProperty({
    description: 'The profile ID to update',
    example: '123456',
  })
  @IsString({ message: 'Invalid profile ID' })
  profileId: string;
}

export class UpdateProfileBodyDto {
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
  @ApiProperty({
    description: 'The image Profile of the user',
    example: 'https://example.com/image.jpg',
  })
  @IsString({ message: 'Invalid image Cover' })
  @IsOptional()
  @IsUrl()
  image: string;
  @ApiProperty({
    description: 'The badge of the user',
    example: 'VERIFIED | UNVERIFIED',
  })
  @IsString()
  @IsOptional()
  badge: badge;
  @ApiProperty({
    description: 'The role of the user',
    example: 'ADMIN | USER',
  })
  @IsString()
  @IsOptional()
  role: roles;
}
