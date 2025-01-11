// scraper.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { GetMangaDto } from './dtos/get-manga';
import { IsheqScraperRepository } from './repository/scraper.repository';
import { CloudinaryService } from './../cloudinary/cloudinary.service';
import { PrismaService } from 'src/shared/prisma.service';
import { Manga } from '@prisma/client';
import { UploadApiResponse } from 'cloudinary';
import { GetChapterDto } from './dtos/get-chapter';
import slugify from 'slugify';
@Injectable()
export class ScraperService {
  constructor(
    private readonly scraperRepository: IsheqScraperRepository,
    private readonly cloudinaryService: CloudinaryService,
    private readonly prismaService: PrismaService,
  ) {}

  async getManga(getMangaDto: GetMangaDto): Promise<Manga> {
    try {
      const mangaData = await this.scraperRepository.getManga(getMangaDto);

      if (!mangaData || !mangaData.cover) {
        throw new BadRequestException(
          'Invalid manga data received from scraper',
        );
      }

      // Upload cover image
      let coverUrl: string;
      try {
        const uploadResult = await this.uploadCoverImage(mangaData.cover);
        coverUrl = uploadResult.secure_url;
      } catch (error) {
        throw new BadRequestException(
          `Failed to upload cover image: ${error.message}`,
        );
      }

      // Create manga record
      const slug = slugify(mangaData.title, {
        replacement: '-',
        lower: true,
        strict: true,
      });
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
      // get the manga slug and chapter number
      const { mangaId, chapterNumber } = getChapterDto;
      const manga = await this.prismaService.manga.findUnique({
        where: { id: mangaId },
        select: { slug: true },
      });
      // Get chapter data from repository
      const chapterData = await this.scraperRepository.getChapter(
        manga.slug,
        chapterNumber,
      );

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
      });
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
