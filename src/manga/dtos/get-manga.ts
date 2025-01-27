import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';
import { ScraperPlatform } from '@prisma/client';

export class GetMangaDto {
  @ApiProperty({
    description: 'Title of the manga ',
    example: 'One Piece',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  title: string;
  @ApiProperty({
    description: 'Platform of the manga ',
    example: 'ASHEQ',
    enum: ScraperPlatform,
  })
  @IsNotEmpty()
  platform: ScraperPlatform;
}
