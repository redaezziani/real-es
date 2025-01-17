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
      console.log('Starting manga scrape:', getMangaDto);
      this.scraperService
        .getManga(getMangaDto)
        .then((manga) => {
          console.log('Manga scraping completed:', manga.id);
        })
        .catch((error) => {
          console.error('Error scraping manga:', error);
        });
    } catch (error) {
      console.error('Error handling manga creation event:', error);
    }
  }

  @EventPattern('scraper.chapter.create')
  async handleChapterCreation(@Payload() getChapterDto: GetChapterDto) {
    try {
      console.log('Starting chapter scrape:', getChapterDto);
      // Process asynchronously without waiting for response
      this.scraperService
        .getChapter(getChapterDto)
        .then((chapter) => {
          console.log('Chapter scraping completed:', chapter.id);
        })
        .catch((error) => {
          console.error('Error scraping chapter:', error);
        });
    } catch (error) {
      console.error('Error handling chapter creation event:', error);
    }
  }
}
