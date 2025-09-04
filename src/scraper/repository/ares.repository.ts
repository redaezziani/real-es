import { Manga } from '../types/manga.type';
import { Chapter, IScraper } from '../interface/scraper';
import * as cheerio from 'cheerio';
import axios from 'axios';
import * as puppeteer from 'puppeteer';
export class AresScraperRepository implements IScraper {
  readonly url: string;

  constructor() {
    this.url = 'https://ar.areascans.org';
  }
  async getManga(title: string): Promise<Manga> {
    const url = `${this.url}/manga/${title}/`;
    const html = await this.getHtml(url);

    const data = this.getMangaData(html);
    return data;
  }

  async getChapter(mangaSlug: string, chapterNumber: number): Promise<Chapter> {
    try {
      // New URL pattern: https://ar.areascans.org/manga-slug-chapter-number/
      const url = `${this.url}/${mangaSlug}-chapter-${chapterNumber}/`;

      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      try {
        const page = await browser.newPage();

        // Set user agent to avoid detection
        await page.setUserAgent(
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        );

        // Navigate to the chapter page
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        // Extract image URLs from various possible selectors
        const pages = await page.evaluate(() => {
          const selectors = [
            '#readerarea img.ts-main-image ',
            '.reading-content img',
            '.chapter-content img',
            '.page-break img',
            'img[src*="chapter"]',
            'img[data-src*="chapter"]',
          ];

          let images: string[] = [];

          for (const selector of selectors) {
            const elements = Array.from(document.querySelectorAll(selector));
            images = elements
              .map(
                (img: any) =>
                  img.getAttribute('src') ||
                  img.getAttribute('data-src') ||
                  img.getAttribute('data-original'),
              )
              .filter((src: string | null) => src != null && src.trim() !== '');

            if (images.length > 0) {
              console.log(
                `Found ${images.length} images with selector: ${selector}`,
              );
              break;
            }
          }

          return images;
        });

        // Get chapter title
        const title =
          (await page.evaluate(() => {
            return (
              document.querySelector('h1')?.textContent?.trim() ||
              document.querySelector('.entry-title')?.textContent?.trim() ||
              document.title
            );
          })) || `Chapter ${chapterNumber}`;

        if (pages.length === 0) {
          throw new Error('No pages found for this chapter');
        }

        console.log(`Found ${pages.length} pages for chapter ${chapterNumber}`);

        return {
          title,
          number: chapterNumber,
          pages,
          releaseDate: new Date(),
        };
      } finally {
        await browser.close();
      }
    } catch (error) {
      console.error(`Error fetching chapter ${chapterNumber}:`, error);
      throw error;
    }
  }

  private async getHtml(url: string): Promise<string> {
    const { data: html } = await axios.get(url);
    return html;
  }

  private getMangaData(html: string): Manga {
    const $ = cheerio.load(html);

    // Extract title
    const title =
      $('h1').first().text().trim() ||
      $('.entry-title').text().trim() ||
      $('.manga-title').text().trim();

    // Extract description - from "قصة العمل" section
    const description =
      $('.container__235ca').text().trim() ||
      $('.summary p').text().trim() ||
      $('.description').text().trim() ||
      $('p')
        .filter((_, el) => $(el).text().includes('العالم في حالة'))
        .text()
        .trim() ||
      'No description available';

    // Extract cover image
    const cover =
      $('img[alt*="' + title + '"]').attr('src') ||
      $('.manga-cover img').attr('src') ||
      $('.thumb img').attr('src') ||
      $('img').first().attr('src') ||
      '';

    // Extract author - from "المؤلف" section
    const authorSection = $('h1, h2, h3')
      .filter((_, el) => $(el).text().trim() === 'المؤلف')
      .next();
    const authorText = authorSection.text().trim();
    const authors =
      authorText && authorText !== 'Updating'
        ? [authorText]
        : ['Unknown Author'];

    // Extract artist - from "الرسام" section
    const artistSection = $('h1, h2, h3')
      .filter((_, el) => $(el).text().trim() === 'الرسام')
      .next();
    const artistText = artistSection.text().trim();
    const artists =
      artistText && artistText !== 'Updating' ? [artistText] : authors;

    // Extract other titles (alternative names)
    const otherTitles: string[] = [];

    // Extract type - from "النوع" section
    const typeSection = $('h1, h2, h3')
      .filter((_, el) => $(el).text().trim() === 'النوع')
      .next();
    const type = typeSection.text().trim() || 'Manhwa';

    // Extract genres from genre links
    const genres: string[] = [];
    $('a[href*="/genres/"]').each((_, el) => {
      const genre = $(el).text().trim();
      if (genre && !genres.includes(genre)) {
        genres.push(genre);
      }
    });

    // Extract status - from "الحالة" section
    const statusSection = $('h1, h2, h3')
      .filter((_, el) => $(el).text().trim() === 'الحالة')
      .next();
    let status = statusSection.text().trim();

    // Normalize status
    switch (status.toLowerCase()) {
      case 'completed':
      case 'مكتملة':
        status = 'مكتملة';
        break;
      case 'ongoing':
      case 'مستمرة':
      case 'مستمر':
        status = 'مستمرة';
        break;
      case 'canceled':
      case 'ملغية':
        status = 'ملغية';
        break;
      default:
        status = status || 'مستمرة';
    }

    // Extract release date - from "تاريخ الإصدار" section
    const releaseDateSection = $('h1, h2, h3')
      .filter((_, el) => $(el).text().trim() === 'تاريخ الإصدار')
      .next();
    const releaseDateText = releaseDateSection.text().trim();

    let releaseDate: string;
    if (releaseDateText && releaseDateText !== 'Updating') {
      const parsedDate = new Date(releaseDateText);
      releaseDate = !isNaN(parsedDate.getTime())
        ? parsedDate.toISOString()
        : new Date().toISOString();
    } else {
      releaseDate = new Date().toISOString();
    }

    return {
      title,
      otherTitles,
      cover,
      authors,
      artists,
      description,
      type,
      releaseDate,
      genres: genres.length > 0 ? genres : ['Unknown'],
      status,
    };
  }
}
