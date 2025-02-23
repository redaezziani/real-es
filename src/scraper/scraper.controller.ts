import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { GetMangaDto } from './dtos/get-manga';
import { GetChapterDto } from './dtos/get-chapter';
import { ScraperService } from './scraper.service';

@Controller()
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) {}

  @EventPattern('scraper.manga.create')
  async handleMangaCreation(@Payload() getMangaDto: GetMangaDto) {
    try {
      const res = await this.scraperService.getManga(getMangaDto);
    } catch (error) {
      console.error('Error handling manga creation event:', error);
    }
  }

  @EventPattern('scraper.chapter.create')
  async handleChapterCreation(@Payload() params: GetChapterDto) {
    try {
      console.log('the params :', params);
      const { chapterNumbers, mangaId } = params;

      for (const chapterNumber of chapterNumbers) {
        await this.scraperService.getChapter({ mangaId, chapterNumber });
      }
    } catch (error) {
      console.error('Error handling chapter creation event:', error);
    }
  }
}
