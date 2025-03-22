import { Manga } from '../types/manga.type';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { Chapter, IScraper } from '../interface/scraper';

export class RocksMangaScraperRepository implements IScraper {
  readonly url: string;

  constructor() {
    this.url = 'https://rocksmanga.com';
  }

  async getManga(title: string): Promise<Manga> {
    const url = `${this.url}/manga/${title}/`; // e.g., https://rocksmanga.com/manga/beast-burn/
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

    // Get title
    const title = $('.info h1').text().trim();

    // Get alternative titles
    const otherTitles = $('.info h6')
      .toArray()
      .map((el) => $(el).text().trim())
      .filter((t) => t.length > 0);

    // Get cover image
    const cover = $('.poster img').attr('src') ?? '';

    // Get author
    const author = $('.meta div:contains("المؤلف") a').text().trim();

    // Get genres
    const genres = $('.meta div:contains("التصنيفات") a')
      .toArray()
      .map((el) => $(el).text().trim())
      .filter((genre) => genre.length > 0);

    // Get description
    const description = $('.description').text().trim();

    // Get status
    const status = $('.info p').first().text().trim(); // "مكتمل" means "Completed"

    // Get release date
    const releaseYear = $('.meta div:contains("سنة الصدور") a').text().trim();
    const releaseDate = releaseYear
      ? `${releaseYear}-01-01T00:00:00Z`
      : new Date().toISOString();

    // Get type
    const type = $('.meta div:contains("النوع") a').text().trim();

    return {
      title,
      otherTitles,
      description,
      cover,
      authors: author ? [author] : [],
      artists: [],
      type: type || 'مانجا',
      releaseDate,
      status: status === 'مكتمل' ? 'مكتمل' : status,
      genres,
    };
  }

  private getChapterData(html: string, chapterNumber: string): Chapter {
    const $ = cheerio.load(html);

    const pages = $('.chapter-content img')
      .toArray()
      .map((img) => $(img).attr('src')?.trim())
      .filter((url): url is string => !!url && url.length > 0)
      .map((url) => url.replace(/[\n\t\r]/g, ''));

    const title = $('.info h1').text().trim() || 'Beast Burn';

    const number = parseFloat(chapterNumber);

    const releaseDate = new Date();

    return {
      title,
      number,
      releaseDate,
      pages,
    };
  }
}
