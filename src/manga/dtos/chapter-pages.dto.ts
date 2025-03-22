import { ApiProperty } from '@nestjs/swagger';

export class ChapterPageDto {
  @ApiProperty()
  mangaName: string;

  @ApiProperty()
  mangaId: string;

  @ApiProperty()
  chapterName: string;

  @ApiProperty()
  chapterNumber: number;

  @ApiProperty()
  chapterId: string;

  @ApiProperty({ type: [String] })
  pages: string[];
}
