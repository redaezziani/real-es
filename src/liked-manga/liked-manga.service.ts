import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { LikedManga } from '@prisma/client';

@Injectable()
export class LikedMangaService {
  constructor(private readonly prisma: PrismaService) {}

  async likeManga(userId: string, mangaId: string): Promise<LikedManga> {
    // Check if manga exists
    const manga = await this.prisma.manga.findUnique({
      where: { id: mangaId },
    });

    if (!manga) {
      throw new NotFoundException('Manga not found');
    }

    // Check if manga is already liked
    const existingLike = await this.prisma.likedManga.findUnique({
      where: {
        userId_mangaId: {
          userId,
          mangaId,
        },
      },
    });

    if (existingLike) {
      throw new ConflictException('Manga is already liked');
    }

    return this.prisma.likedManga.create({
      data: {
        userId,
        mangaId,
      },
      include: {
        manga: {
          select: {
            id: true,
            title: true,
            cover: true,
            slug: true,
          },
        },
      },
    });
  }

  async unlikeManga(userId: string, mangaId: string): Promise<void> {
    const likedManga = await this.prisma.likedManga.findUnique({
      where: {
        userId_mangaId: {
          userId,
          mangaId,
        },
      },
    });

    if (!likedManga) {
      throw new NotFoundException('Liked manga not found');
    }

    await this.prisma.likedManga.delete({
      where: {
        userId_mangaId: {
          userId,
          mangaId,
        },
      },
    });
  }

  async getUserLikedManga(
    userId: string,
    query?: {
      search?: string;
      page?: number;
      limit?: number;
      genre?: string;
      status?: string;
    },
  ) {
    const { search, page = 1, limit = 20, genre, status } = query || {};
    const skip = (page - 1) * limit;

    const where: any = {
      userId,
    };

    // Build manga filter conditions
    const mangaWhere: any = {};

    if (search) {
      mangaWhere.title = {
        contains: search,
        mode: 'insensitive',
      };
    }

    if (genre) {
      mangaWhere.genres = {
        has: genre,
      };
    }

    if (status) {
      mangaWhere.status = status;
    }

    if (Object.keys(mangaWhere).length > 0) {
      where.manga = mangaWhere;
    }

    const [likedManga, total] = await Promise.all([
      this.prisma.likedManga.findMany({
        where,
        include: {
          manga: {
            select: {
              id: true,
              title: true,
              cover: true,
              slug: true,
              rating: true,
              genres: true,
              authors: true,
              status: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.likedManga.count({ where }),
    ]);

    return {
      likedManga,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async isLiked(userId: string, mangaId: string): Promise<boolean> {
    try {
      console.log(
        'LikedMangaService: Checking like for userId:',
        userId,
        'mangaId:',
        mangaId,
      );
      const likedManga = await this.prisma.likedManga.findUnique({
        where: {
          userId_mangaId: {
            userId,
            mangaId,
          },
        },
      });
      console.log('LikedMangaService: Found like:', !!likedManga);
      return !!likedManga;
    } catch (error) {
      console.error('LikedMangaService: Error in isLiked:', error);
      throw error;
    }
  }

  async toggleLike(userId: string, mangaId: string) {
    const isLiked = await this.isLiked(userId, mangaId);

    if (isLiked) {
      await this.unlikeManga(userId, mangaId);
      return { liked: false, message: 'Like removed' };
    } else {
      await this.likeManga(userId, mangaId);
      return { liked: true, message: 'Manga liked' };
    }
  }

  async getMangaLikeCount(mangaId: string): Promise<number> {
    return this.prisma.likedManga.count({
      where: {
        mangaId,
      },
    });
  }

  async getMostLikedManga(limit: number = 10) {
    const mostLiked = await this.prisma.likedManga.groupBy({
      by: ['mangaId'],
      _count: {
        mangaId: true,
      },
      orderBy: {
        _count: {
          mangaId: 'desc',
        },
      },
      take: limit,
    });

    const mangaIds = mostLiked.map((item) => item.mangaId);

    const manga = await this.prisma.manga.findMany({
      where: {
        id: {
          in: mangaIds,
        },
      },
      select: {
        id: true,
        title: true,
        cover: true,
        slug: true,
        rating: true,
        genres: true,
        authors: true,
        status: true,
      },
    });

    return mostLiked.map((item) => ({
      manga: manga.find((m) => m.id === item.mangaId),
      likeCount: item._count.mangaId,
    }));
  }
}
