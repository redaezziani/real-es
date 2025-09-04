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
    const formattedChapterNumber =
      chapterNumber < 10 ? `0${chapterNumber}` : `${chapterNumber}`;
    let url = `${this.url}/manga/${slug}/${formattedChapterNumber}`;

    console.log('Fetching chapter from URL:', url);

    try {
      const html = await this.getHtml(url);
      const chapterData = this.getChapterData(html, chapterNumber);

      // Check if we found any images/pages
      if (chapterData.pages && chapterData.pages.length > 0) {
        console.log(
          `Found ${chapterData.pages.length} pages with formatted number`,
        );
        return chapterData;
      } else {
        console.log(
          'No images found with formatted number, trying unformatted number...',
        );
        throw new Error('No images found');
      }
    } catch (error) {
      console.log('Failed with formatted number, trying unformatted number...');

      // Try with unformatted chapter number
      url = `${this.url}/manga/${slug}/${chapterNumber}`;
      console.log('Fetching chapter from URL (unformatted):', url);

      const html = await this.getHtml(url);
      const chapterData = this.getChapterData(html, chapterNumber);

      if (chapterData.pages && chapterData.pages.length > 0) {
        console.log(
          `Found ${chapterData.pages.length} pages with unformatted number`,
        );
        return chapterData;
      } else {
        throw new Error(
          `No images found for chapter ${chapterNumber} with either format`,
        );
      }
    }
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
    console.log('Getting chapter data for chapter number:', chapterNumber);
    console.log('HTML content length:', html.length);
    const $ = cheerio.load(html);

    let pages = $('.reading-content img')
      .toArray()
      .map((img) => $(img).attr('src')?.trim())
      .filter((url): url is string => !!url && url.length > 0)
      .map((url) => url.replace(/[\n\t\r]/g, ''));

    console.log(
      `Found ${pages.length} pages with .reading-content img selector`,
    );

    if (pages.length === 0) {
      pages = $('img.wp-manga-chapter-img')
        .toArray()
        .map((img) => $(img).attr('src')?.trim())
        .filter((url): url is string => !!url && url.length > 0)
        .map((url) => url.replace(/[\n\t\r]/g, ''));

      console.log(
        `Found ${pages.length} pages with img.wp-manga-chapter-img selector`,
      );
    }

    // Try additional selectors if still no pages found
    if (pages.length === 0) {
      console.log('Trying additional image selectors...');
      const alternativeSelectors = [
        '.chapter-content img',
        '.page-break img',
        '#chapter_imgs img',
        '.chapter-images img',
        '.chapter img',
      ];

      for (const selector of alternativeSelectors) {
        pages = $(selector)
          .toArray()
          .map((img) => $(img).attr('src')?.trim())
          .filter((url): url is string => !!url && url.length > 0)
          .map((url) => url.replace(/[\n\t\r]/g, ''));

        console.log(`Found ${pages.length} pages with ${selector} selector`);
        if (pages.length > 0) break;
      }
    }

    const title =
      $('ol.breadcrumb li.active').text().trim() ||
      $('.chapter-title').text().trim() ||
      `Chapter ${chapterNumber}`;
    const number = chapterNumber;
    const releaseDate = new Date();

    console.log(`Final result: title="${title}", pages=${pages.length}`);

    return {
      title,
      number,
      releaseDate,
      pages,
    };
  }
}
