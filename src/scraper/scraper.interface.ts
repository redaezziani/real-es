import { GetMangaDto } from './dtos/get-manga';
import { Manga } from './types/manga.type';

export interface Scraper {
  getManga(getMangaDto: GetMangaDto): Promise<Manga>;
  getChapter(slug: string, chapterNumber: string): Promise<any>;
}
