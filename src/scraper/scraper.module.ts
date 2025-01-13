import { Module } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { ScraperController } from './scraper.controller';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { PrismaService } from 'src/shared/prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { ScraperFactory } from './scraper.factory';
import { AsheqScraperRepository } from './repository/asheq.repository';
import { AresScraperRepository } from './repository/ares.repository';

@Module({
  imports: [NotificationsModule],
  providers: [
    ScraperService,
    ScraperFactory,
    CloudinaryService,
    PrismaService,
    AsheqScraperRepository,
    AresScraperRepository,
  ],
  controllers: [ScraperController],
})
export class ScraperModule {}
