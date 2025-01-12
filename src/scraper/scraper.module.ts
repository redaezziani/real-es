import { Module } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { ScraperController } from './scraper.controller';
import { IsheqScraperRepository } from './repository/scraper.repository';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { PrismaService } from 'src/shared/prisma.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  providers: [
    ScraperService,
    IsheqScraperRepository,
    CloudinaryService,
    PrismaService,
  ],
  controllers: [ScraperController],
})
export class ScraperModule {}
