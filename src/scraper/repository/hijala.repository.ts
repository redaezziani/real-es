import { Manga } from '../types/manga.type';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { Chapter, IScraper } from '../interface/scraper';
import * as puppeteer from 'puppeteer';

export class HijalaScraperRepository implements IScraper {
  readonly url: string;

  constructor() {
    this.url = 'https://hijala.com';
  }

  async getManga(title: string): Promise<Manga> {
    const url = `${this.url}/${title}/`;
    const html = await this.getHtml(url);
    return this.getMangaData(html);
  }

  async getChapter(mangaId: string, chapterNumber: number): Promise<Chapter> {
    try {
      const url = `${this.url}/${mangaId}-${chapterNumber}/`;
      console.log('Attempting to fetch chapter from:', url);

      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      try {
        const page = await browser.newPage();

        page.on('console', (msg) =>
          console.log('Browser console:', msg.text()),
        );

        await page.setDefaultNavigationTimeout(30000);

        await page.goto(url, { waitUntil: 'domcontentloaded' });

        await page.waitForSelector('#readerarea', { timeout: 5000 });

        await new Promise((resolve) => setTimeout(resolve, 2000));

        const currentUrl = await page.url();
        console.log('Current page URL:', currentUrl);

        const data = await page.evaluate(() => {
          console.log('Starting page evaluation');

          const selectors = [
            '#readerarea img.ts-main-image',
            '#readerarea img',
            '.reading-content img',
          ];

          let images = [];
          for (const selector of selectors) {
            images = Array.from(document.querySelectorAll(selector));
            console.log(
              `Found ${images.length} images with selector: ${selector}`,
            );
            if (images.length > 0) break;
          }

          const title =
            document.querySelector('.entry-title')?.textContent?.trim() || '';

          const pages = images
            .map((img) => {
              const dataSrc = img.getAttribute('data-src');
              const src = img.getAttribute('src');
              const dataLazy = img.getAttribute('data-lazy-src');
              console.log('Image attributes:', { dataSrc, src, dataLazy });
              return dataSrc || dataLazy || src;
            })
            .filter((src) => src && !src.includes('data:image'))
            .map((src) => src.replace(/[\n\t\r]/g, '').trim());

          console.log(`Processed ${pages.length} valid image sources`);
          return { title, pages };
        });

        console.log('Extracted data:', data);

        if (!data.pages.length) {
          throw new Error('No image sources found in chapter');
        }

        return {
          title: data.title || `Chapter ${chapterNumber}`,
          number: chapterNumber,
          releaseDate: new Date(),
          pages: data.pages,
        };
      } catch (error) {
        console.error('Scraping error:', {
          message: error.message,
          stack: error.stack,
          url: url,
        });
        throw error;
      } finally {
        await browser.close();
      }
    } catch (error) {
      throw new Error(`Failed to fetch chapter: ${error.message}`);
    }
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

    const pages = $('#readerarea img.ts-main-image')
      .toArray()
      .map((img) => {
        const src = $(img).attr('src') || $(img).attr('data-src');
        return src ? src.trim() : null;
      })
      .filter((url): url is string => !!url && url.length > 0)
      .map((url) => url.replace(/[\n\t\r]/g, ''));

    if (pages.length === 0) {
      throw new Error('No pages found for this chapter');
    }

    const title = $('.entry-title').text().trim() || `Chapter ${chapterNumber}`;
    const number = parseFloat(chapterNumber);

    return {
      title,
      number,
      releaseDate: new Date(),
      pages,
    };
  }
}
