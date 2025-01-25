import { RedisService } from './../redis/redis.service';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { IManga } from './manga.interface';
import { Manga } from '@prisma/client';

import { AutoCompleteDto } from './dtos/auto-complet';
import { MangaQueryDto } from './dtos/manga-query.dto';
import {
  PaginatedResponse,
  SingleResponse,
} from '../common/types/api-response.type';
import { PaginationQueryDto } from '../common/dtos/pagination-query.dto';
import { ChapterPageDto } from './dtos/chapter-pages.dto';

@Injectable()
export class MangaService implements IManga {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async all(query: MangaQueryDto): Promise<PaginatedResponse<Manga>> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        genres,
        status,
        minRating,
        themes,
        types,
      } = query;

      const skip = (page - 1) * limit;

      // Build the where clause based on filters
      const where: any = {};

      if (search) {
        const searchTerm = search.toLowerCase().trim();
        where.OR = [
          {
            title: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
          {
            otherTitles: {
              hasSome: [searchTerm], // Fix: Wrap searchTerm in array
            },
          },
          {
            slug: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
        ];
      }

      if (Array.isArray(genres) && genres.length > 0) {
        where.genres = {
          hasEvery: genres,
        };
      }

      if (Array.isArray(status) && status.length > 0) {
        where.status = {
          in: status,
        };
      }

      if (minRating) {
        where.rating = {
          gte: minRating,
        };
      }

      if (Array.isArray(themes) && themes.length > 0) {
        where.themes = {
          hasEvery: themes,
        };
      }

      if (Array.isArray(types) && types.length > 0) {
        where.type = {
          in: types,
        };
      }

      const [items, totalItems] = await Promise.all([
        this.prismaService.manga.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            updatedAt: 'desc',
          },
        }),
        this.prismaService.manga.count({ where }),
      ]);

      const totalPages = Math.ceil(totalItems / limit);

      return {
        success: true,
        data: {
          items,
          meta: {
            currentPage: page,
            itemsPerPage: limit,
            totalItems,
            totalPages,
          },
        },
      };
    } catch (error) {
      console.error('Error in all manga query:', error);
      throw new Error(`Failed to fetch mangas: ${error.message}`);
    }
  }

  async byId(id: string): Promise<SingleResponse<Manga>> {
    try {
      const manga = await this.prismaService.manga.findFirst({
        where: {
          OR: [{ id }, { slug: id }],
        },
        include: {
          chapters: {
            orderBy: {
              number: 'desc',
            },
          },
        },
      });
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
    } catch (error) {
      console.error('Error in byId manga query:', error);
      throw new Error(`Failed to fetch manga by id: ${error.message}`);
    }
  }

  async getPopularMangas(): Promise<Manga[]> {
    try {
      const raw = await this.prismaService.$queryRaw<
        Manga[]
      >`SELECT * FROM "Manga" ORDER BY rating DESC, views DESC LIMIT 10`;
      return raw;
    } catch (error) {
      console.error('Error in getPopularMangas:', error);
      throw new Error(`Failed to fetch popular mangas: ${error.message}`);
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
      console.error('Error in getLatestMangas:', error);
      throw new Error(`Failed to fetch latest mangas: ${error.message}`);
    }
  }
  async getMangaByGenre(
    genre: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<Manga>> {
    try {
      // cache key
      const cacheKey = `genre:${genre}:${JSON.stringify(query)}`;
      const cachedResults = await this.redisService.get(cacheKey);
      if (cachedResults) {
        return JSON.parse(cachedResults);
      }

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

      await this.redisService.set(
        cacheKey,
        JSON.stringify({
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
        }),
      );
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
      console.error('Error in getMangaByGenre:', error);
      throw new Error(`Failed to fetch manga by genre: ${error.message}`);
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
      console.error('Error in autocomplete:', error);
      throw new Error(`Autocomplete failed: ${error.message}`);
    }
  }
  async getStatus(): Promise<string[]> {
    try {
      const cacheKey = 'status';
      let cachedResults = await this.redisService.get(cacheKey);

      // Try to parse JSON only if we have cached results
      let parsedResults: string[] | null = null;
      if (cachedResults) {
        try {
          parsedResults = JSON.parse(cachedResults);
        } catch (e) {
          console.warn('Invalid cached status, fetching fresh data');
        }
      }

      if (parsedResults) {
        return parsedResults;
      }

      const status = await this.prismaService.manga.findMany({
        select: {
          status: true,
        },
      });

      const uniqueStatus = [
        ...new Set(status.map((manga) => manga.status)),
      ].filter((status) => status !== null);

      // Ensure proper JSON stringification
      await this.redisService.set(cacheKey, JSON.stringify(uniqueStatus));

      return uniqueStatus;
    } catch (error) {
      console.error('Error in getStatus:', error);
      throw new Error(`Failed to fetch status: ${error.message}`);
    }
  }

  async getGenres(): Promise<string[]> {
    try {
      const cacheKey = 'genres';
      let cachedResults = await this.redisService.get(cacheKey);

      // Try to parse JSON only if we have cached results
      let parsedResults: string[] | null = null;
      if (cachedResults) {
        try {
          parsedResults = JSON.parse(cachedResults);
        } catch (e) {
          console.warn('Invalid cached genres, fetching fresh data');
        }
      }

      if (parsedResults) {
        return parsedResults;
      }

      const genres = await this.prismaService.manga.findMany({
        select: {
          genres: true,
        },
      });

      const uniqueGenres = [
        ...new Set(genres.flatMap((manga) => manga.genres)),
      ];

      // Ensure proper JSON stringification
      await this.redisService.set(cacheKey, JSON.stringify(uniqueGenres));

      return uniqueGenres;
    } catch (error) {
      console.error('Error in getGenres:', error);
      throw new Error(`Failed to fetch genres: ${error.message}`);
    }
  }
  async getTypes(): Promise<string[]> {
    try {
      const types = await this.prismaService.manga.findMany({
        select: {
          type: true,
        },
      });

      const uniqueTypes = [...new Set(types.map((manga) => manga.type))].filter(
        (type) => type !== null,
      );

      return uniqueTypes;
    } catch (error) {
      console.error('Error in getTypes:', error);
      throw new Error(`Failed to fetch types: ${error.message}`);
    }
  }

  async getChapterPages(
    id: string,
    chapter: string,
  ): Promise<SingleResponse<ChapterPageDto>> {
    try {
      const manga = await this.prismaService.manga.findFirst({
        where: {
          OR: [{ id }, { slug: id }],
        },
        select: {
          title: true,
          chapters: {
            where: {
              number: parseInt(chapter),
            },
            select: {
              title: true,
              number: true,
              pages: {
                select: {
                  image: true,
                },
                orderBy: {
                  number: 'asc',
                },
              },
            },
          },
        },
      });

      if (!manga) {
        return {
          success: false,
          message: 'Manga not found',
          data: null,
        };
      }

      const chapterData = manga.chapters[0];
      if (!chapterData) {
        return {
          success: false,
          message: 'Chapter not found',
          data: null,
        };
      }

      return {
        success: true,
        data: {
          mangaName: manga.title,
          chapterName: chapterData.title,
          chapterNumber: chapterData.number,
          pages: chapterData.pages.map((page) => page.image),
        },
      };
    } catch (error) {
      console.error('Error in getChapterPages:', error);
      throw new Error(`Failed to fetch chapter pages: ${error.message}`);
    }
  }
}
