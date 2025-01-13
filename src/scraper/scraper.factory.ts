// scraper.factory.ts
import { Injectable } from '@nestjs/common';
import { IScraper } from './interface/scraper';
import { ScraperPlatform } from './types/enums/platform.enum';
import { AsheqScraperRepository } from './repository/asheq.repository';
import { AresScraperRepository } from './repository/ares.repository';

@Injectable()
export class ScraperFactory {
  private readonly scrapers: Map<ScraperPlatform, IScraper>;

  constructor(
    private readonly asheqScraper: AsheqScraperRepository,
    private readonly aresScraper: AresScraperRepository,
  ) {
    this.scrapers = new Map<ScraperPlatform, IScraper>([
      [ScraperPlatform.ASHEQ, asheqScraper],
      [ScraperPlatform.ARES, aresScraper],
    ]);
  }

  getScraper(platform: ScraperPlatform): IScraper {
    const scraper = this.scrapers.get(platform);
    if (!scraper) {
      throw new Error(
        `No scraper implementation found for platform: ${platform}`,
      );
    }
    return scraper;
  }
}
