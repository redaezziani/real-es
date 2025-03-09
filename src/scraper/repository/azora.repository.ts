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

    // Get genres from the categories section
    const genres = $('.genres-content a')
      .toArray()
      .map((el) => $(el).text().trim())
      .filter((genre) => genre.length > 0);


    // Get description paragraphs
    const descriptionParts = $('.manga-summary p')
      .toArray()
      .map((p) => $(p).text().trim());
    const description = descriptionParts.join('\n');

    return {
      title: $('.post-title h1').text().trim(),
      otherTitles: [], // No alternative titles section found in provided HTML
      description,
      cover: $('.summary_image a img').attr('src') || '',
      authors,
      artists: [], // No specific artist field in provided HTML
      type: 'Manga', // Assuming type since not explicitly specified
      releaseDate: new Date().toISOString(), // No release date in provided HTML
      status: 'Updating', // Based on author field showing "Updating"
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

    const title = $('.post-title h1').text().trim(); // Adjust this selector based on actual chapter page structure
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
