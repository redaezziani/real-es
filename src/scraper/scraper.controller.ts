import { Controller, Get, Query } from '@nestjs/common';
import { GetMangaDto } from './dtos/get-manga';
import { ScraperService } from './scraper.service';
import { GetChapterDto } from './dtos/get-chapter';
@Controller('scraper')
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) {}
  @Get('/manga')
  async getManga(@Query() getManagaDto: GetMangaDto) {
    const manga = await this.scraperService.getManga(getManagaDto);
    return manga;
  }
  @Get('/chapter')
  async getChapter(@Query() getChapterDto: GetChapterDto) {
    const chapter = await this.scraperService.getChapter(getChapterDto);
    return chapter;
  }
}
