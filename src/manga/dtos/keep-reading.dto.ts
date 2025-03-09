import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateKeepReadingDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  mangaId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  chapterId: string;
}
