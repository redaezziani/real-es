import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class GetChapterDto {
  @ApiProperty({
    description: 'Manga Id',
    example: '550e8400-e29b-41d4-a716-446655440000',
    minLength: 3,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  mangaId: string;
  @ApiProperty({
    description: 'Chapter number',
    example: '1',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  chapterNumber: string;
}
