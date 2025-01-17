// scraper.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { GetMangaDto } from './dtos/get-manga';
import { CloudinaryService } from './../cloudinary/cloudinary.service';
import { PrismaService } from 'src/shared/prisma.service';
import { Manga } from '@prisma/client';
import { UploadApiResponse } from 'cloudinary';
import { GetChapterDto } from './dtos/get-chapter';
import slugify from 'slugify';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationPriority } from '@prisma/client';
import { ScraperPlatform } from './types/enums/platform.enum';
import { IScraper } from './interface/scraper';
import { ScraperFactory } from './scraper.factory';

@Injectable()
export class ScraperService {
  private readonly scrapers: Map<ScraperPlatform, IScraper>;
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly prismaService: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly scraperFactory: ScraperFactory,
  ) {}

  async getManga(getMangaDto: GetMangaDto): Promise<Manga> {
    try {
      const slug = slugify(getMangaDto.title, {
        replacement: '-',
        lower: true,
        strict: true,
      });

      const existMange = await this.prismaService.manga.findMany({
        where: {
          slug: slug,
        },
      });
      if (existMange.length > 0) {
        throw new BadRequestException('Alredy exist Mange ');
      }
      const scraper = this.scraperFactory.getScraper(
        getMangaDto.platform || ScraperPlatform.ASHEQ,
      );
      const mangaData = await scraper.getManga(getMangaDto.title);

      if (!mangaData || !mangaData.cover) {
        throw new BadRequestException(
          'Invalid manga data received from scraper',
        );
      }

      let coverUrl: string;
      try {
        const uploadResult = await this.uploadCoverImage(mangaData.cover);
        coverUrl = uploadResult.secure_url;
      } catch (error) {
        throw new BadRequestException(
          `Failed to upload cover image: ${error.message}`,
        );
      }


      const manga = await this.prismaService.manga.create({
        data: {
          title: mangaData.title,
          otherTitles: mangaData.otherTitles,
          description: mangaData.description,
          cover: coverUrl,
          authors: mangaData.authors,
          artists: mangaData.artists,
          type: mangaData.type,
          releaseDate: mangaData.releaseDate,
          status: mangaData.status,
          genres: mangaData.genres,
          slug,
        },
      });

      const admins = await this.prismaService.profiles.findMany({
        where: { role: 'ADMIN' },
        select: { userId: true },
      });

      await Promise.all(
        admins.map((admin) =>
          this.notificationsService.createAndSendNotification(
            admin.userId,
            'NEW_MANGA',
            {
              mangaId: manga.id,
              title: manga.title,
              slug: manga.slug,
              coverUrl: manga.cover,
            },
            NotificationPriority.HIGH,
          ),
        ),
      );

      return manga;
    } catch (error) {
      console.log(error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to process manga: ${error.message}`,
      );
    }
  }
  async getChapter(getChapterDto: GetChapterDto) {
    try {
      const { mangaId, chapterNumber } = getChapterDto;
      const manga = await this.prismaService.manga.findUnique({
        where: { id: mangaId },
        select: { slug: true, platform: true },
      });

      if (!manga) {
        throw new BadRequestException('Manga not found');
      }

      const platform = manga.platform as ScraperPlatform;
      const scraper = this.scraperFactory.getScraper(platform);
      const chapterData = await scraper.getChapter(manga.slug, chapterNumber);

      if (!chapterData || !chapterData.pages || !chapterData.pages.length) {
        throw new BadRequestException(
          'Invalid chapter data received from scraper',
        );
      }

      // Upload chapter pages
      const pages = [];
      for (const page of chapterData.pages) {
        try {
          const uploadResult = await this.uploadChapterPage(page);
          pages.push(uploadResult.secure_url);
        } catch (error) {
          throw new BadRequestException(
            `Failed to upload chapter page: ${error.message}`,
          );
        }
      }

      // save chapter data
      const chapter = await this.prismaService.chapter.create({
        data: {
          number: parseInt(chapterNumber, 10),
          title: chapterData.title,
          releaseDate: chapterData.releaseDate,
          slug: slugify(chapterData.title, {
            replacement: '-',
            lower: true,
            strict: true,
          }),
          manga: { connect: { id: mangaId } },
          pages: {
            create: pages.map((page, index) => ({
              image: page,
              number: index + 1,
            })),
          },
        },
        include: {
          manga: true,
        },
      });

      // Get users with notification preferences for this manga
      const interestedUsers =
        await this.prismaService.notificationPreference.findMany({
          where: {
            inAppEnabled: true,
            categories: {
              has: 'MANGA_UPDATES',
            },
          },
          select: {
            userId: true,
          },
        });

      // Send notifications to interested users
      await Promise.all(
        interestedUsers.map((user) =>
          this.notificationsService.createAndSendNotification(
            user.userId,
            'NEW_CHAPTER',
            {
              mangaId: chapter.manga.id,
              mangaTitle: chapter.manga.title,
              chapterId: chapter.id,
              chapterNumber: chapter.number,
            },
            NotificationPriority.MEDIUM,
          ),
        ),
      );

      return chapter;
    } catch (error) {
      console.log(error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to process chapter: ${error.message}`,
      );
    }
  }
  private async uploadCoverImage(cover: string): Promise<UploadApiResponse> {
    if (!cover) {
      throw new BadRequestException('Cover URL is required');
    }

    const folderName = 'manga-covers';
    const result = await this.cloudinaryService.uploadFromUrl(
      cover,
      folderName,
    );

    if ('error' in result || !result.secure_url) {
      throw new BadRequestException(
        'Failed to upload cover image to Cloudinary',
      );
    }

    return result as UploadApiResponse;
  }
  private async uploadChapterPage(page: string): Promise<UploadApiResponse> {
    if (!page) {
      throw new BadRequestException('Page URL is required');
    }

    try {
      // Validate URL format
      new URL(page);
    } catch (error: any) {
      console.log(error);
      throw new BadRequestException(`Invalid page URL: ${page}`);
    }

    const folderName = 'manga-pages';
    const result = await this.cloudinaryService.uploadFromUrl(page, folderName);

    if ('error' in result || !result.secure_url) {
      throw new BadRequestException(
        'Failed to upload chapter page to Cloudinary',
      );
    }

    return result as UploadApiResponse;
  }
}
