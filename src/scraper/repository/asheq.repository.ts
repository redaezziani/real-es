import { Manga } from '../types/manga.type';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { Chapter, IScraper } from '../interface/scraper';

export class AsheqScraperRepository implements IScraper {
  readonly url: string;

  constructor() {
    this.url = 'https://3asq.org';
  }

  async getManga(title: string): Promise<Manga> {
    const url = `${this.url}/manga/${title}`;
    const html = await this.getHtml(url);
    const data = this.getMangaData(html);

    return data;
  }
  async getChapter(slug: string, chapterNumber: number): Promise<Chapter> {
    const url = `${this.url}/manga/${slug}/${chapterNumber}`;
    const html = await this.getHtml(url);
    return this.getChapterData(html, chapterNumber);
  }

  private async getHtml(url: string): Promise<string> {
    const { data: html } = await axios.get(url);
    return html;
  }

  private getMangaData(html: string): Manga {
    const $ = cheerio.load(html);

    const authorText = $('.author-content a').text();
    const authors = authorText
      .split(',')
      .map((author) => author.trim())
      .filter((author) => author.length > 0);

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

    const dateText = $('.post-status .summary-content').first().text().trim();

    let releaseDate = new Date(dateText);

    if (isNaN(releaseDate.getTime())) {
      releaseDate = new Date();
    }

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
      releaseDate: releaseDate.toISOString(),
      status: $('.post-status .summary-content').last().text().trim(),
      genres,
    };
  }

  private getChapterData(html: string, chapterNumber: number): Chapter {
    const $ = cheerio.load(html);
    const pages = $('.reading-content img')
      .toArray()
      .map((img) => $(img).attr('src')?.trim())
      .filter((url): url is string => !!url && url.length > 0)
      .map((url) => url.replace(/[\n\t\r]/g, ''));

    const title = $('ol.breadcrumb li.active').text().trim();
    const number = chapterNumber;
    const releaseDate = new Date();
    return {
      title,
      number,
      releaseDate,
      pages,
    };
  }
}
