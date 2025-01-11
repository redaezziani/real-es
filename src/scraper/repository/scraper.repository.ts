// scraper.repository.ts
import { GetMangaDto } from '../dtos/get-manga';
import { Manga } from '../types/manga.type';
import { Scraper } from '../scraper.interface';
import * as cheerio from 'cheerio';
import axios from 'axios';

interface Chapter {
  title: string;
  number: number;
  releaseDate: Date;
  pages: string[];
}
export class IsheqScraperRepository implements Scraper {
  readonly url: string;

  constructor() {
    this.url = 'https://3asq.org';
  }

  async getManga(getMangaDto: GetMangaDto): Promise<Manga> {
    const { title } = getMangaDto;
    const url = `${this.url}/manga/${title}`;
    const html = await this.getHtml(url);
    const manga = this.getMangaData(html);
    return manga;
  }
  async getChapter(slug: string, chapterNumber: string): Promise<Chapter> {
    const url = `${this.url}/manga/${slug}/${chapterNumber}`;
    const html = await this.getHtml(url);
    const chapter = this.getChapterData(html, chapterNumber);
    return chapter;
  }

  private async getHtml(url: string): Promise<string> {
    const { data: html } = await axios.get(url);
    return html;
  }

  private getMangaData(html: string): Manga {
    const $ = cheerio.load(html);

    // Fix the author split issue
    const authorText = $('.author-content a').text();
    const authors = authorText
      .split(',')
      .map((author) => author.trim())
      .filter((author) => author.length > 0);

    // Fixed splitting for other fields
    const otherTitles = $('.post-content .post-content_item .summary-content')
      .eq(2)
      .text()
      .split(',')
      .map((title) => title.trim())
      .filter((title) => title.length > 0);

    const genres = $('.post-content .post-content_item .summary-content')
      .eq(5)
      .text()
      .split(',')
      .map((genre) => genre.trim())
      .filter((genre) => genre.length > 0);

    return {
      title: $('.post-title h1').text().trim(),
      otherTitles,
      description: $('.manga-excerpt p').text().trim(),
      cover: $('.summary_image a img').attr('src') || '',
      authors,
      artists: [$('.artist-content a').text().trim()], // Wrapped in array to match interface
      type: $('.post-content .post-content_item .summary-content')
        .eq(6)
        .text()
        .trim(),
      releaseDate: new Date(
        $('.post-status .summary-content').first().text().trim(),
      ).toISOString(),
      status: $('.post-status .summary-content').last().text().trim(),
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

    const title = $('ol.breadcrumb li.active').text().trim();
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
