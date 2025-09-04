import { Manga } from '../types/manga.type';
import * as cheerio from 'cheerio';
import * as puppeteer from 'puppeteer';
import { Chapter, IScraper } from '../interface/scraper';

export class LekmangaScraperRepository implements IScraper {
  readonly url: string;

  constructor() {
    this.url = 'https://lekmanga.net';
  }

  async getManga(title: string): Promise<Manga> {
    const url = `${this.url}/manga/${title}`;
    console.log('Fetching manga from URL:', url);

    const html = await this.getHtml(url);
    console.log('HTML content length:', html.length);
    console.log('HTML preview (first 500 chars):', html.substring(0, 500));

    const data = this.getMangaData(html);
    console.log('Extracted manga data:', JSON.stringify(data, null, 2));

    return data;
  }

  async getChapter(slug: string, chapterNumber: number): Promise<Chapter> {
    const url = `${this.url}/manga/${slug}/${chapterNumber}`;

    console.log('Fetching chapter from URL:', url);
    const html = await this.getChapterHtml(url);
    return this.getChapterData(html, chapterNumber);
  }

  private async getHtml(url: string): Promise<string> {
    let browser: puppeteer.Browser | null = null;
    try {
      browser = await puppeteer.launch({
        headless: false, // Temporarily use non-headless to see if it bypasses Cloudflare
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--disable-blink-features=AutomationControlled',
          '--disable-features=VizDisplayCompositor',
          '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          '--window-size=1366,768',
          '--disable-web-security',
          '--disable-features=site-per-process',
        ],
      });

      const page = await browser.newPage();

      // Hide that we're using automation
      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
        });
      });

      // Set realistic headers and user agent
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      );

      await page.setExtraHTTPHeaders({
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
        'Cache-Control': 'max-age=0',
        'Sec-Ch-Ua':
          '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      });

      // Set viewport
      await page.setViewport({ width: 1366, height: 768 });

      console.log('Navigating to:', url);

      // Navigate to the page
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      // Check if we're on a Cloudflare challenge page
      let title = await page.title();
      console.log('Page title:', title);

      if (
        title.includes('Just a moment') ||
        title.includes('Verifying you are human') ||
        title.includes('Checking your browser')
      ) {
        console.log('Cloudflare challenge detected, waiting for resolution...');

        // Wait longer for the challenge to complete automatically
        let attempts = 0;
        const maxAttempts = 6; // 30 seconds total

        while (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds

          title = await page.title();
          console.log(`Attempt ${attempts + 1}: Page title is "${title}"`);

          // Check if we've moved past the challenge page
          if (
            !title.includes('Just a moment') &&
            !title.includes('Verifying you are human') &&
            !title.includes('Checking your browser')
          ) {
            console.log('Cloudflare challenge resolved!');
            break;
          }

          attempts++;
        }

        // If still on challenge page, try alternative approaches
        if (
          title.includes('Just a moment') ||
          title.includes('Verifying you are human') ||
          title.includes('Checking your browser')
        ) {
          console.log(
            'Challenge still active, trying alternative approaches...',
          );

          // Try clicking if there's a button or checkbox
          try {
            await page.waitForSelector('[type="button"]', { timeout: 2000 });
            await page.click('[type="button"]');
            await new Promise((resolve) => setTimeout(resolve, 3000));
          } catch (e) {
            console.log('No clickable button found');
          }

          // Try waiting for specific selectors that indicate the real page
          try {
            await page.waitForSelector(
              '.post-title, .summary_image, .entry-title',
              {
                timeout: 10000,
              },
            );
            console.log('Content selector found after alternative approach');
          } catch (e) {
            console.log('Content selector still not found');
          }
        }
      }

      // Additional wait for dynamic content
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Check final page title
      const finalTitle = await page.title();
      console.log('Final page title:', finalTitle);

      // Get the HTML content
      const html = await page.content();
      console.log('HTML length:', html.length);

      return html;
    } catch (error) {
      console.error('Error fetching HTML from:', url, error);
      throw new Error(`Failed to fetch HTML from ${url}: ${error.message}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  private async getChapterHtml(url: string): Promise<string> {
    let browser: puppeteer.Browser | null = null;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--disable-blink-features=AutomationControlled',
          '--disable-features=VizDisplayCompositor',
        ],
      });

      const page = await browser.newPage();

      // Hide that we're using automation
      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
        });
      });

      // Set realistic headers and user agent
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      );

      await page.setExtraHTTPHeaders({
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
        'Cache-Control': 'max-age=0',
        'Sec-Ch-Ua':
          '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      });

      // Set viewport
      await page.setViewport({ width: 1366, height: 768 });

      // Navigate to the page
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      // Check if we're on a Cloudflare challenge page
      const title = await page.title();
      console.log('Chapter page title:', title);

      if (
        title.includes('Just a moment') ||
        title.includes('Verifying you are human')
      ) {
        console.log(
          'Cloudflare challenge detected on chapter page, waiting for resolution...',
        );

        // Wait for the challenge to complete
        try {
          await page.waitForNavigation({
            waitUntil: 'networkidle2',
            timeout: 30000,
          });
        } catch (e) {
          console.log(
            'No navigation occurred, checking if chapter content changed...',
          );
        }
      }

      // Wait for chapter images to load - try multiple selectors
      try {
        await page.waitForSelector(
          '.reading-content img, .chapter-content img, .page-break img, .entry-content img, img.chapter-img, .wp-manga-chapter-img, .chapter-images img',
          {
            timeout: 10000,
          },
        );
      } catch (e) {
        console.log(
          'Images selector not found, continuing with content loading...',
        );
      }

      // Additional wait for dynamic content
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Scroll down to trigger lazy loading if needed
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });

      // Wait a bit more for lazy loaded images
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Get the HTML content
      const html = await page.content();
      return html;
    } catch (error) {
      console.error('Error fetching chapter HTML from:', url, error);
      throw new Error(
        `Failed to fetch chapter HTML from ${url}: ${error.message}`,
      );
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  private getMangaData(html: string): Manga {
    const $ = cheerio.load(html);

    // Extract title from .post-title h1
    const title =
      $('.post-title h1').text().trim() ||
      $('.entry-title').text().trim() ||
      $('h1').first().text().trim() ||
      'Unknown Title';

    // Extract description from .summary__content
    const description =
      $('.description-summary .summary__content p').text().trim() ||
      $('.summary__content').text().trim() ||
      $('.description').text().trim() ||
      'No description available';

    // Extract cover image from .summary_image img
    let cover =
      $('.summary_image img').attr('src') ||
      $('.summary_image img').attr('data-src') ||
      '';

    // Clean cover URL - no need to prepend domain as it's already full URL
    if (cover && !cover.startsWith('http')) {
      cover = cover.startsWith('/')
        ? `${this.url}${cover}`
        : `${this.url}/${cover}`;
    }

    // Extract authors from .author-content
    const authorText = $('.author-content').text().trim();
    const authors =
      authorText && authorText !== 'Updating'
        ? authorText
            .split(',')
            .map((author) => author.trim())
            .filter((author) => author.length > 0)
        : ['Unknown Author'];

    // Extract artists from .artist-content
    const artistText = $('.artist-content').text().trim();
    const artists =
      artistText && artistText !== 'Updating'
        ? artistText
            .split(',')
            .map((artist) => artist.trim())
            .filter((artist) => artist.length > 0)
        : authors; // Fallback to authors if artists not found

    // Extract other titles from the "اسماء اخرى" section
    const otherTitlesText = $('.post-content_item')
      .filter((_, el) => {
        return $(el).find('.summary-heading h5').text().trim() === 'اسماء اخرى';
      })
      .find('.summary-content')
      .text()
      .trim();

    const otherTitles =
      otherTitlesText && otherTitlesText !== 'Updating'
        ? otherTitlesText
            .split(',')
            .map((title) => title.trim())
            .filter((title) => title.length > 0)
        : [];

    // Extract genres from .genres-content a
    const genres: string[] = [];
    $('.genres-content a').each((_, element) => {
      const genre = $(element).text().trim();
      if (genre && !genres.includes(genre)) {
        genres.push(genre);
      }
    });

    // Extract type from the "النوع" section
    const typeText = $('.post-content_item')
      .filter((_, el) => {
        return $(el).find('.summary-heading h5').text().trim() === 'النوع';
      })
      .find('.summary-content')
      .text()
      .trim();
    const type = typeText && typeText !== 'Updating' ? typeText : 'Manga';

    // Extract status from the "الحالة" section in .post-status
    const statusText = $('.post-status .post-content_item')
      .filter((_, el) => {
        return $(el).find('.summary-heading h5').text().trim() === 'الحالة';
      })
      .find('.summary-content')
      .text()
      .trim();
    const status = statusText || 'Unknown';

    // Extract release date from the "سنة الانتاج" section
    const releaseDateText = $('.post-status .post-content_item')
      .filter((_, el) => {
        return (
          $(el).find('.summary-heading h5').text().trim() === 'سنة الانتاج'
        );
      })
      .find('.summary-content')
      .text()
      .trim();

    let releaseDate = new Date();
    if (releaseDateText && releaseDateText !== 'Updating') {
      const parsedDate = new Date(releaseDateText);
      if (!isNaN(parsedDate.getTime())) {
        releaseDate = parsedDate;
      }
    }

    return {
      title,
      otherTitles,
      description,
      cover,
      authors,
      artists,
      type,
      releaseDate: releaseDate.toISOString(),
      status,
      genres: genres.length > 0 ? genres : ['Unknown'],
    };
  }

  private getChapterData(html: string, chapterNumber: number): Chapter {
    console.log('Getting chapter data for chapter number:', chapterNumber);
    const $ = cheerio.load(html);

    // Extract chapter pages - try multiple selectors
    let pages: string[] = [];

    // Try different selectors for chapter images
    const selectors = [
      '.reading-content img',
      '.chapter-content img',
      '.page-break img',
      '.entry-content img',
      'img.chapter-img',
      '.wp-manga-chapter-img',
      '.chapter-images img',
      '.chapter-container img',
      '#chapter-content img',
      '.manga-reading img',
      'div[class*="chapter"] img',
      'div[class*="reading"] img',
    ];

    for (const selector of selectors) {
      const images = $(selector).toArray();
      console.log(`Trying selector ${selector}, found ${images.length} images`);

      pages = images
        .map((img) => {
          const src =
            $(img).attr('src')?.trim() ||
            $(img).attr('data-src')?.trim() ||
            $(img).attr('data-lazy')?.trim() ||
            $(img).attr('data-original')?.trim();
          return src;
        })
        .filter((url): url is string => !!url && url.length > 0)
        .map((url) => {
          // Clean up the URL
          let cleanUrl = url.replace(/[\n\t\r]/g, '');
          // Ensure full URL
          if (cleanUrl && !cleanUrl.startsWith('http')) {
            cleanUrl = cleanUrl.startsWith('/')
              ? `${this.url}${cleanUrl}`
              : `${this.url}/${cleanUrl}`;
          }
          return cleanUrl;
        })
        .filter((url) => {
          // Filter out non-image URLs and common placeholders
          return (
            url &&
            url.length > 0 &&
            !url.includes('placeholder') &&
            !url.includes('loading') &&
            !url.includes('blank') &&
            (url.includes('.jpg') ||
              url.includes('.jpeg') ||
              url.includes('.png') ||
              url.includes('.webp') ||
              url.includes('.gif'))
          );
        });

      console.log(
        `Selector ${selector} found ${pages.length} valid image URLs`,
      );
      if (pages.length > 0) {
        break; // Found pages, stop trying other selectors
      }
    }

    // If no images found with standard selectors, try to find any images in the page
    if (pages.length === 0) {
      console.log(
        'No images found with standard selectors, trying all images on page',
      );
      pages = $('img')
        .toArray()
        .map((img) => {
          const src =
            $(img).attr('src')?.trim() ||
            $(img).attr('data-src')?.trim() ||
            $(img).attr('data-lazy')?.trim() ||
            $(img).attr('data-original')?.trim();
          return src;
        })
        .filter((url): url is string => !!url && url.length > 0)
        .map((url) => {
          let cleanUrl = url.replace(/[\n\t\r]/g, '');
          if (cleanUrl && !cleanUrl.startsWith('http')) {
            cleanUrl = cleanUrl.startsWith('/')
              ? `${this.url}${cleanUrl}`
              : `${this.url}/${cleanUrl}`;
          }
          return cleanUrl;
        })
        .filter((url) => {
          return (
            url &&
            url.length > 0 &&
            !url.includes('placeholder') &&
            !url.includes('loading') &&
            !url.includes('logo') &&
            !url.includes('icon') &&
            !url.includes('avatar') &&
            (url.includes('.jpg') ||
              url.includes('.jpeg') ||
              url.includes('.png') ||
              url.includes('.webp') ||
              url.includes('.gif')) &&
            (url.includes('chapter') ||
              url.includes('page') ||
              url.includes('manga'))
          );
        });
    }

    console.log(`Final page count: ${pages.length}`);

    // Extract chapter title
    const title =
      $('.entry-title').text().trim() ||
      $('.chapter-title').text().trim() ||
      $('.wp-manga-chapter-title').text().trim() ||
      $('h1').first().text().trim() ||
      `Chapter ${chapterNumber}`;

    return {
      title,
      number: chapterNumber,
      releaseDate: new Date(),
      pages,
    };
  }
}
