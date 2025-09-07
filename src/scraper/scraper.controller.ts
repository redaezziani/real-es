import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { GetMangaDto } from './dtos/get-manga';
import { GetChapterDto } from './dtos/get-chapter';
import { ScraperService } from './scraper.service';

@Controller()
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) {
    console.log('🎯 ScraperController initialized');
  }

  @EventPattern('scraper.manga.create')
  async handleMangaCreation(@Payload() getMangaDto: GetMangaDto) {
    console.log('🎯 RECEIVED EVENT: scraper.manga.create');
    console.log('📚 Processing manga creation request:', getMangaDto);
    try {
      const res = await this.scraperService.getManga(getMangaDto);
      console.log('✅ Manga creation completed successfully:', res.title);
    } catch (error) {
      console.error('❌ Error handling manga creation event:', error);
    }
  }

  @EventPattern('test.event')
  async handleTestEvent(@Payload() data: any) {
    console.log('🧪 TEST EVENT RECEIVED:', data);
  }

  @EventPattern('scraper.chapter.create')
  async handleChapterCreation(@Payload() params: GetChapterDto) {
    try {
      const { chapterNumbers, mangaId } = params;

      for (const chapterNumber of chapterNumbers) {
        await this.scraperService.getChapter({ mangaId, chapterNumber });
      }
    } catch (error) {
      console.error('Error handling chapter creation event:', error);
    }
  }
}
