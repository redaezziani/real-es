import { ApiProperty } from '@nestjs/swagger';

export class ChapterPageDto {
  @ApiProperty()
  mangaName: string;

  @ApiProperty()
  chapterName: string;

  @ApiProperty()
  chapterNumber: number;

  @ApiProperty({ type: [String] })
  pages: string[];
}
