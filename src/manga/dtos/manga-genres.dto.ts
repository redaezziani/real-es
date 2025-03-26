import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty } from 'class-validator';

export class MangaGenresDto {
  @ApiProperty({
    description: 'List of genres to filter mangas',
    example: ['Action', 'Adventure'],
    type: [String],
  })
  @IsArray()
  @IsNotEmpty()
  genres: string[];
}
