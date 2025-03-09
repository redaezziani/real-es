import { Manga } from '../types/manga.type';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { Chapter, IScraper } from '../interface/scraper';

export class HijalaScraperRepository implements IScraper {
  readonly url: string;

  constructor() {
    this.url = 'https://hijala.com';
  }

  async getManga(title: string): Promise<Manga> {
    const url = `${this.url}/${title}/`; // e.g., https://hijala.com/wind-breaker/
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

    const title = $('.entry-title').text().trim();

    const otherTitles = $('.alternative')
      .text()
      .trim()
      .split(' | ')
      .filter((t) => t.length > 0);

    const cover =
      $('.info-left img.wp-post-image').attr('data-src') ||
      $('.info-left img.wp-post-image').attr('src') ||
      '';

    const author = $('.imptdt:contains("المؤلف") i').text().trim();
    const artist = $('.imptdt:contains("الرسام") i').text().trim();

    const genres = $('.mgen a')
      .toArray()
      .map((el) => $(el).text().trim())
      .filter((genre) => genre.length > 0);

    const description = $('.entry-content p').text().trim();

    const status = $('.imptdt:contains("الحالة") i').text().trim();

    const releaseDate =
      $('.imptdt:contains("نشر بتاريخ") time').attr('datetime') ??
      new Date().toISOString();

    return {
      title,
      otherTitles,
      description,
      cover,
      authors: [author],
      artists: [artist],
      type: 'مانهوا',
      releaseDate,
      status,
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

    const title = $('.entry-title').text().trim() || 'Wind Breaker';

    const number = parseFloat(chapterNumber);

    const releaseDateStr = $(
      `.eph-num a[href*="${chapterNumber}"] .chapterdate`,
    )
      .text()
      .trim();
    const releaseDate = releaseDateStr ? new Date(releaseDateStr) : new Date();

    return {
      title,
      number,
      releaseDate,
      pages,
    };
  }
}
