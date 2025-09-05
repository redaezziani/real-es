import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../shared/prisma.service';
import { Bookmark } from '@prisma/client';

@Injectable()
export class BookmarksService {
  constructor(private readonly prisma: PrismaService) {}

  async createBookmark(userId: string, mangaId: string): Promise<Bookmark> {
    // Check if manga exists
    const manga = await this.prisma.manga.findUnique({
      where: { id: mangaId },
    });

    if (!manga) {
      throw new NotFoundException('Manga not found');
    }

    // Check if bookmark already exists
    const existingBookmark = await this.prisma.bookmark.findUnique({
      where: {
        userId_mangaId: {
          userId,
          mangaId,
        },
      },
    });

    if (existingBookmark) {
      throw new ConflictException('Manga is already bookmarked');
    }

    return this.prisma.bookmark.create({
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

  async removeBookmark(userId: string, mangaId: string): Promise<void> {
    const bookmark = await this.prisma.bookmark.findUnique({
      where: {
        userId_mangaId: {
          userId,
          mangaId,
        },
      },
    });

    if (!bookmark) {
      throw new NotFoundException('Bookmark not found');
    }

    await this.prisma.bookmark.delete({
      where: {
        userId_mangaId: {
          userId,
          mangaId,
        },
      },
    });
  }

  async getUserBookmarks(
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

    const [bookmarks, total] = await Promise.all([
      this.prisma.bookmark.findMany({
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
      this.prisma.bookmark.count({ where }),
    ]);

    return {
      bookmarks,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async isBookmarked(userId: string, mangaId: string): Promise<boolean> {
    try {
      console.log(
        'BookmarksService: Checking bookmark for userId:',
        userId,
        'mangaId:',
        mangaId,
      );
      const bookmark = await this.prisma.bookmark.findUnique({
        where: {
          userId_mangaId: {
            userId,
            mangaId,
          },
        },
      });
      console.log('BookmarksService: Found bookmark:', !!bookmark);
      return !!bookmark;
    } catch (error) {
      console.error('BookmarksService: Error in isBookmarked:', error);
      throw error;
    }
  }

  async toggleBookmark(userId: string, mangaId: string) {
    const isBookmarked = await this.isBookmarked(userId, mangaId);

    if (isBookmarked) {
      await this.removeBookmark(userId, mangaId);
      return { bookmarked: false, message: 'Bookmark removed' };
    } else {
      await this.createBookmark(userId, mangaId);
      return { bookmarked: true, message: 'Bookmark added' };
    }
  }
}
