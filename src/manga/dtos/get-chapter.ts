import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class GetChapterQueryDto {
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
}

export class GetChapterBodyDto {
  @ApiProperty({
    description: 'Chapter numbers',
    example: [1, 2, 3],
    type: [Number],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsInt({ each: true })
  @Min(1, { each: true })
  chapterNumbers: number[];
}
