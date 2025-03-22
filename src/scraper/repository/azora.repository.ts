import { Manga } from '../types/manga.type';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { Chapter, IScraper } from '../interface/scraper';

export class AzoraMoonScraperRepository implements IScraper {
  readonly url: string;

  constructor() {
    this.url = 'https://azoramoon.com';
  }

  async getManga(title: string): Promise<Manga> {
    const url = `${this.url}/series/${title}`;
    const html = await this.getHtml(url);
    return this.getMangaData(html);
  }

  async getChapter(mangaId: string, chapterNumber: number): Promise<Chapter> {
    throw new Error('Method not implemented.');
  }

  private async getHtml(url: string): Promise<string> {
    const { data: html } = await axios.get(url);
    return html;
  }

  private getMangaData(html: string): Manga {
    const $ = cheerio.load(html);

    // Get authors (single author case from the provided HTML)
    const authorText = $('.manga-authors').text().trim();
    const authors = authorText === 'Updating' ? ['Updating'] : [authorText];

    const genres = $('.genres-content a')
      .toArray()
      .map((el) => $(el).text().trim())
      .filter((genre) => genre.length > 0);

    const descriptionParts = $('.manga-summary p')
      .toArray()
      .map((p) => $(p).text().trim());
    const description = descriptionParts.join('\n');

    return {
      title: $('.post-title h1').text().trim(),
      otherTitles: [], // لا توجد عناوين بديلة في HTML المقدم
      description,
      cover: $('.summary_image a img').attr('src') || '',
      authors,
      artists: [], // لا يوجد حقل خاص بالفنان في HTML المقدم
      type: 'مانجا',
      releaseDate: new Date().toISOString(),
      status: 'مستمر',
      genres,
    };
  }

  private getChapterData(html: string, chapterNumber: string): Chapter {
    const $ = cheerio.load(html);
    const pages = $('.reading-content img')
      .toArray()
      .map((img) => $(img).attr('src')?.trim())
      .filter((url): url is string => !!url && url.length > 0)
      .map((url) => url.replace(/[\n\t\r]/g, ''));

    const title = $('.post-title h1').text().trim(); 
    const number = parseInt(chapterNumber);
    const releaseDate = new Date();

    return {
      title,
      number,
      releaseDate,
      pages,
    };
  }
}
