import { Injectable, BadRequestException } from '@nestjs/common';
import { GetMangaDto } from './dtos/get-manga';
import { CloudinaryService } from './../cloudinary/cloudinary.service';
import { PrismaService } from 'src/shared/prisma.service';
import { Manga } from '@prisma/client';
import { UploadApiResponse } from 'cloudinary';
import slugify from 'slugify';
import { NotificationsService } from '../notifications/notifications.service';
import { MangaNotificationGateway } from '../shared/websocket/gateways/manga-notification.gateway';
import { NotificationPriority } from '@prisma/client';
import { ScraperPlatform } from './types/enums/platform.enum';
import { IScraper } from './interface/scraper';
import { ScraperFactory } from './scraper.factory';
import * as Sharp from 'sharp';

@Injectable()
export class ScraperService {
  private readonly scrapers: Map<ScraperPlatform, IScraper>;
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly prismaService: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly scraperFactory: ScraperFactory,
    private readonly mangaNotificationGateway: MangaNotificationGateway,
  ) {}

  async getManga(getMangaDto: GetMangaDto): Promise<Manga> {
    console.log('🔄 Starting manga scraping process for:', getMangaDto.title);
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
      let coverThumbnail: string;
      try {
        const uploadResult = await this.uploadCoverImage(mangaData.cover);
        coverUrl = uploadResult.secure_url;
        const uploadTwoResult = await this.generateThumbnail(mangaData.cover);
        coverThumbnail = uploadTwoResult;
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
          coverThumbnail: coverThumbnail,
          platform: getMangaDto.platform,
          slug,
        },
      });

      await this.calculateAndStoreSimilarities(manga);

      const admins = await this.prismaService.profiles.findMany({
        where: {
          role: {
            name: 'USER',
          },
        },
        select: { userId: true },
      });

      await Promise.all(
        admins.map((client) =>
          this.notificationsService.createAndSendNotification(
            client.userId,
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

      // Send WebSocket notification for new manga
      console.log('📡 Attempting to send WebSocket notification for manga:', manga.title);
      try {
        await this.mangaNotificationGateway.sendNewMangaNotification({
          mangaId: manga.id,
          mangaTitle: manga.title,
          mangaSlug: manga.slug,
          coverImage: manga.cover,
        });
        console.log('✅ WebSocket notification sent successfully for manga:', manga.title);
      } catch (error) {
        console.error('❌ Failed to send WebSocket notification:', error);
      }

      return manga;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to process manga: ${error.message}`,
      );
    }
  }
  async getChapter(getChapterDto: { mangaId: string; chapterNumber: number }) {
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

      const existChapter = await this.prismaService.chapter.findMany({
        where: {
          mangaId: mangaId,
          number: chapterNumber,
        },
      });
      if (existChapter.length > 0) {
        throw new BadRequestException('Alredy exist Chapter ');
      }

      const chapter = await this.prismaService.chapter.create({
        data: {
          number: chapterNumber,
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

      const admins = await this.prismaService.profiles.findMany({
        where: {
          role: {
            name: 'ADMIN',
          },
        },
        select: { userId: true },
      });

      await Promise.all(
        admins.map((user) =>
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

      // Send WebSocket notification for new chapter
      await this.mangaNotificationGateway.sendNewChapterNotification({
        mangaId: chapter.manga.id,
        mangaTitle: chapter.manga.title,
        mangaSlug: chapter.manga.slug,
        chapterId: chapter.id,
        chapterNumber: chapter.number,
        chapterTitle: chapter.title,
        coverImage: chapter.manga.cover,
      });

      return chapter;
    } catch (error) {
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

  private async generateThumbnail(imageUrl: string): Promise<string> {
    try {
      // Download the image first
      const response = await fetch(imageUrl);
      const arrayBuffer = await response.arrayBuffer();
      const imageBuffer = Buffer.from(arrayBuffer);

      // Create thumbnail using Sharp
      const thumbnailBuffer = await Sharp(imageBuffer)
        .resize(200, 300, {
          fit: 'cover',
          position: 'center',
        })
        .toBuffer();

      // Upload the thumbnail
      const folderName = 'manga-thumbnails';
      const result = await this.cloudinaryService.uploadFromBuffer(
        thumbnailBuffer,
        folderName,
      );

      if ('error' in result || !result.secure_url) {
        throw new BadRequestException('Failed to upload thumbnail image');
      }

      return result.secure_url;
    } catch (error) {
      throw new BadRequestException(
        'Failed to generate and upload thumbnail: ' + error.message,
      );
    }
  }

  private async calculateAndStoreSimilarities(newManga: Manga): Promise<void> {
    try {
      // Get all existing manga except the new one
      const existingManga = await this.prismaService.manga.findMany({
        where: {
          id: {
            not: newManga.id,
          },
        },
        select: {
          id: true,
          genres: true,
          authors: true,
          artists: true,
          type: true,
        },
      });

      // Calculate and store similarities for each existing manga
      const similarityPromises = existingManga.map(async (existingManga) => {
        const score = this.calculateSimilarityScore(newManga, existingManga);

        // Create bidirectional similarity records
        await this.prismaService.mangaSimilarity.createMany({
          data: [
            {
              sourceMangaId: newManga.id,
              targetMangaId: existingManga.id,
              score,
            },
            {
              sourceMangaId: existingManga.id,
              targetMangaId: newManga.id,
              score,
            },
          ],
          skipDuplicates: true,
        });
      });

      await Promise.all(similarityPromises);
    } catch (error) {
      console.error('Failed to calculate manga similarities:', error);
      // Don't throw error to prevent blocking manga creation
    }
  }

  private calculateSimilarityScore(manga1: Manga, manga2: any): number {
    let score = 0;

    // Compare genres (40% weight)
    const genres1 = manga1.genres || [];
    const genres2 = manga2.genres || [];
    if (genres1.length > 0 || genres2.length > 0) {
      const sharedGenres = genres1.filter((g) => genres2.includes(g));
      const maxGenres = Math.max(genres1.length, genres2.length);
      score += (sharedGenres.length / maxGenres) * 0.4;
    }

    // Compare authors (30% weight)
    const authors1 = manga1.authors || [];
    const authors2 = manga2.authors || [];
    if (authors1.length > 0 || authors2.length > 0) {
      const sharedAuthors = authors1.filter((a) => authors2.includes(a));
      const maxAuthors = Math.max(authors1.length, authors2.length);
      score += (sharedAuthors.length / maxAuthors) * 0.3;
    }

    // Compare artists (20% weight)
    const artists1 = manga1.artists || [];
    const artists2 = manga2.artists || [];
    if (artists1.length > 0 || artists2.length > 0) {
      const sharedArtists = artists1.filter((a) => artists2.includes(a));
      const maxArtists = Math.max(artists1.length, artists2.length);
      score += (sharedArtists.length / maxArtists) * 0.2;
    }

    // Compare type (10% weight)
    if (manga1.type && manga2.type && manga1.type === manga2.type) {
      score += 0.1;
    }

    // Ensure score is a valid number between 0 and 1
    return Math.max(0, Math.min(1, isNaN(score) ? 0 : score));
  }
}
