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

  async getChapter(slug: string, chapterNumber: number): Promise<Chapter> {
    // Try with direct chapter number first (e.g., /74/)
    let url = `${this.url}/series/${slug}/${chapterNumber}/`;

    console.log('Fetching chapter from URL:', url);

    try {
      const html = await this.getHtml(url);
      const chapterData = this.getChapterData(html, chapterNumber.toString());

      // Check if we found any images/pages
      if (chapterData.pages && chapterData.pages.length > 0) {
        console.log(
          `Found ${chapterData.pages.length} pages with direct number`,
        );
        return chapterData;
      } else {
        console.log(
          'No images found with direct number, trying formatted number...',
        );
        throw new Error('No images found');
      }
    } catch (error) {
      console.log('Failed with direct number, trying formatted number...');

      // Try with formatted chapter number (e.g., /074/)
      const formattedChapterNumber =
        chapterNumber < 10
          ? `0${chapterNumber}`
          : chapterNumber < 100
            ? `0${chapterNumber}`
            : `${chapterNumber}`;
      url = `${this.url}/series/${slug}/${formattedChapterNumber}/`;
      console.log('Fetching chapter from URL (formatted):', url);

      const html = await this.getHtml(url);
      const chapterData = this.getChapterData(html, chapterNumber.toString());

      if (chapterData.pages && chapterData.pages.length > 0) {
        console.log(
          `Found ${chapterData.pages.length} pages with formatted number`,
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
    console.log('Getting chapter data for chapter number:', chapterNumber);
    console.log('HTML content length:', html.length);
    const $ = cheerio.load(html);

    // Try primary selector: .reading-content img.wp-manga-chapter-img
    let pages = $('.reading-content img.wp-manga-chapter-img')
      .toArray()
      .map((img) => $(img).attr('src')?.trim())
      .filter((url): url is string => !!url && url.length > 0)
      .map((url) => url.replace(/[\n\t\r]/g, ''));

    console.log(
      `Found ${pages.length} pages with .reading-content img.wp-manga-chapter-img selector`,
    );

    // Try fallback selector: .reading-content img
    if (pages.length === 0) {
      pages = $('.reading-content img')
        .toArray()
        .map((img) => $(img).attr('src')?.trim())
        .filter((url): url is string => !!url && url.length > 0)
        .map((url) => url.replace(/[\n\t\r]/g, ''));

      console.log(
        `Found ${pages.length} pages with .reading-content img selector`,
      );
    }

    // Try additional selectors if still no pages found
    if (pages.length === 0) {
      console.log('Trying additional image selectors...');
      const alternativeSelectors = [
        'img.wp-manga-chapter-img',
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
      $('.post-title h1').text().trim() ||
      $('.chapter-title').text().trim() ||
      $('.entry-title').text().trim() ||
      `Chapter ${chapterNumber}`;
    const number = parseInt(chapterNumber);
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
