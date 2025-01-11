import { RedisService } from './../redis/redis.service';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { IManga } from './manga.interface';
import { Manga } from '@prisma/client';

import { AutoCompleteDto } from './dtos/auto-complet';
import {
  PaginatedResponse,
  SingleResponse,
} from '../common/types/api-response.type';
import { PaginationQueryDto } from '../common/dtos/pagination-query.dto';

@Injectable()
export class MangaService implements IManga {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async all(query: PaginationQueryDto): Promise<PaginatedResponse<Manga>> {
    try {
      const { search = '', limit = 10, page = 1 } = query;

      // Ensure numbers are used
      const take = Number(limit);
      const skip = (Number(page) - 1) * take;

      const [data, totalCount] = await Promise.all([
        this.prismaService.manga.findMany({
          where: {
            OR: [{ title: { contains: search } }],
          },
          skip,
          take,
        }),
        this.prismaService.manga.count({
          where: {
            OR: [{ title: { contains: search } }],
          },
        }),
      ]);

      const totalPages = Math.ceil(totalCount / take);

      return {
        success: true,
        data: {
          items: data,
          meta: {
            currentPage: Number(page),
            itemsPerPage: take,
            totalItems: totalCount,
            totalPages,
          },
        },
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async byId(id: string): Promise<SingleResponse<Manga>> {
    const manga = await this.prismaService.manga.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        chapters: true,
      },
    });
    // if manga is not found
    if (!manga) {
      return {
        success: false,
        message: 'Manga not found',
        data: null,
      };
    }
    await this.prismaService.manga.update({
      where: {
        id: manga.id,
      },
      data: {
        views: manga.views + 1,
      },
    });

    return {
      success: true,
      data: manga,
    };
  }

  async getPopularMangas(): Promise<Manga[]> {
    try {
      const raw = await this.prismaService.$queryRaw<
        Manga[]
      >`SELECT * FROM "Manga" ORDER BY rating DESC, views DESC LIMIT 10`;
      return raw;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async getLatestMangas(): Promise<Manga[]> {
    try {
      const mangas = await this.prismaService.manga.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      });
      return mangas;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async getMangaByGenre(
    genre: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<Manga>> {
    try {
      const { limit = 10, page = 1 } = query;
      const take = Number(limit);
      const skip = (Number(page) - 1) * take;

      const [data, totalCount] = await Promise.all([
        this.prismaService.manga.findMany({
          where: {
            genres: {
              has: genre, // Fixed: changed hasAny to has
            },
          },
          skip,
          take,
          orderBy: {
            rating: 'desc',
          },
        }),
        this.prismaService.manga.count({
          where: {
            genres: {
              has: genre, // Fixed: changed hasAny to has
            },
          },
        }),
      ]);

      const totalPages = Math.ceil(totalCount / take);

      return {
        success: true,
        data: {
          items: data,
          meta: {
            currentPage: Number(page),
            itemsPerPage: take,
            totalItems: totalCount,
            totalPages,
          },
        },
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }
  // New autocomplete method
  async autocomplete(query: AutoCompleteDto): Promise<string[]> {
    try {
      const { search } = query;
      if (!search) return [];

      const cacheKey = `autocomplete:${search.toLowerCase()}`;
      const cachedResults = await this.redisService.get(cacheKey);

      if (cachedResults) {
        return JSON.parse(cachedResults);
      }

      const results = await this.prismaService.manga.findMany({
        where: {
          OR: [
            {
              title: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              otherTitles: {
                hasSome: [search],
              },
            },
          ],
        },
        select: {
          title: true,
          otherTitles: true,
        },
        take: 10,
        orderBy: {
          rating: 'desc',
        },
      });

      const formattedResults = [
        ...new Set(
          results.flatMap((manga) => [
            manga.title,
            ...(manga.otherTitles || []),
          ]),
        ),
      ]
        .filter((title) => title.toLowerCase().includes(search.toLowerCase()))
        .slice(0, 10);

      await this.redisService.set(cacheKey, JSON.stringify(formattedResults));

      return formattedResults;
    } catch (error) {
      throw new Error(`Autocomplete failed: ${error.message}`);
    }
  }
}
