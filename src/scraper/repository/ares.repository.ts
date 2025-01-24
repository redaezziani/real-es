import { Manga } from '../types/manga.type';
import { Chapter, IScraper } from '../interface/scraper';
import * as cheerio from 'cheerio';
import axios from 'axios';
import * as puppeteer from 'puppeteer';
export class AresScraperRepository implements IScraper {
  readonly url: string;

  constructor() {
    this.url = 'https://fl-ares.com';
  }
  async getManga(title: string): Promise<Manga> {
    const url = `${this.url}/series/${title}`;
    const html = await this.getHtml(url);

    const data = this.getMangaData(html);
    return data;
  }

  async getChapter(mangaSlug: string, chapterNumber: string): Promise<Chapter> {
    try {
      const url = `https://fl-ares.com/${mangaSlug}-chapter-${chapterNumber}/`;

      const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      try {
        const page = await browser.newPage();

        // Block image requests to speed up loading
        await page.setRequestInterception(true);
        page.on('request', (request) => {
          if (request.resourceType() === 'image') {
            request.abort();
          } else {
            request.continue();
          }
        });

        // Navigate and wait for DOMContentLoaded instead of waiting for images
        await page.goto(url, { waitUntil: 'domcontentloaded' });

        // Extract image URLs directly from the DOM
        const pages = await page.evaluate(() => {
          const images = Array.from(
            document.querySelectorAll('img.ts-main-image'),
          );
          return images
            .map(
              (img) => img.getAttribute('src') || img.getAttribute('data-src'),
            )
            .filter((src) => src != null);
        });

        // Get chapter title
        const title = `Chapter ${chapterNumber}`;

        if (pages.length === 0) {
          throw new Error('No pages found for this chapter');
        }

        return {
          title: title || `Chapter ${chapterNumber}`,
          number: parseInt(chapterNumber),
          pages,
          releaseDate: new Date(),
        };
      } finally {
        await browser.close();
      }
    } catch (error) {
      throw error;
    }
  }

  private async getHtml(url: string): Promise<string> {
    const { data: html } = await axios.get(url);
    return html;
  }

  private getMangaData(html: string): Manga {
    const $ = cheerio.load(html);

    const title = $('.entry-title').text().trim();

    // Fix the author split issue and the author selector is the 4th element
    const authorText = $('.tsinfo .imptdt i').eq(3).text();
    const authors = authorText
      .split(',')
      .map((author) => author.trim())
      .filter((author) => author.length > 0);

    const artistsText = $('.tsinfo .imptdt i').eq(4).text();
    const artists = artistsText
      .split(',')
      .map((artist) => artist.trim())
      .filter((artist) => artist.length > 0);

    const otherTitles = [];

    const type = $('.tsinfo .imptdt i').eq(1).text().trim();
    const genres = $('.mgen a')
      .map((_, el) => $(el).text())
      .get();
    const description = $('.entry-content.entry-content-single p')
      .text()
      .trim();
    let releaseDate = $('.tsinfo .imptdt li[datetime]').attr('datetime') || '';
    let status = $('.tsinfo .imptdt i').eq(0).text().trim();
    switch (status.toLowerCase()) {
      case 'completed':
        status = 'مكتملة';
        break;
      case 'ongoing':
        status = 'مستمرة';
        break;
      case 'canceled':
        status = 'ملغية';
        break;
    }
    if (!Date.parse(releaseDate)) {
      releaseDate = new Date().toISOString();
    }
    return {
      title,
      otherTitles,
      cover: $('.thumb img').attr('src') || '',
      authors,
      artists,
      description,
      type,
      releaseDate,
      genres,
      status,
    };
  }
}
