import { Injectable } from '@nestjs/common';

import { InteractionType, Manga } from '@prisma/client';
import { PrismaService } from 'src/shared/prisma.service';

@Injectable()
export class MangaRecommendationService {
  constructor(private readonly prismaService: PrismaService) {}
  async getPersonalizedRecommendations(
    userId: string,
    limit: number = 10,
  ): Promise<Manga[]> {
    // Get user's recently interacted manga
    const userInteractions = await this.prismaService.mangaInteraction.findMany(
      {
        where: {
          userId,
          type: {
            in: [
              InteractionType.VIEW,
              InteractionType.LIKE,
              InteractionType.BOOKMARK,
            ],
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { mangaId: true },
      },
    );

    const mangaIds = userInteractions.map((i) => i.mangaId);

    // Get similar manga based on user's recent interactions
    const similarManga = await this.prismaService.mangaSimilarity.findMany({
      where: {
        sourceMangaId: { in: mangaIds },
      },
      orderBy: { score: 'desc' },
      take: limit,
      include: {
        targetManga: true,
      },
    });

    return similarManga.map((s) => s.targetManga);
  }

  async getSimilarManga(mangaId: string, limit: number = 6): Promise<Manga[]> {
    const similarManga = await this.prismaService.mangaSimilarity.findMany({
      where: {
        sourceMangaId: mangaId,
      },
      orderBy: { score: 'desc' },
      take: limit,
      include: {
        targetManga: true,
      },
    });

    return similarManga.map((s) => s.targetManga);
  }

  async updateMangaSimilarities(): Promise<void> {
    const allManga = await this.prismaService.manga.findMany({
      select: {
        title: true,
        id: true,
        genres: true,
        authors: true,
        artists: true,
        type: true,
      },
    });

    for (const sourceManga of allManga) {
      for (const targetManga of allManga) {
        if (sourceManga.id === targetManga.id) continue;

        const score = this.calculateSimilarityScore(sourceManga, targetManga);

        await this.prismaService.mangaSimilarity.upsert({
          where: {
            sourceMangaId_targetMangaId: {
              sourceMangaId: sourceManga.id,
              targetMangaId: targetManga.id,
            },
          },
          create: {
            sourceMangaId: sourceManga.id,
            targetMangaId: targetManga.id,
            score,
          },
          update: {
            score,
          },
        });
      }
    }
  }

  private calculateSimilarityScore(manga1: any, manga2: any): number {
    let score = 0;

    const sharedGenres = manga1.genres.filter((g: string) =>
      manga2.genres.includes(g),
    );
    score +=
      (sharedGenres.length /
        Math.max(manga1.genres.length, manga2.genres.length)) *
      0.4;

    const sharedAuthors = manga1.authors.filter((a: string) =>
      manga2.authors.includes(a),
    );
    score +=
      (sharedAuthors.length /
        Math.max(manga1.authors.length, manga2.authors.length)) *
      0.3;

    const sharedArtists = manga1.artists.filter((a: string) =>
      manga2.artists.includes(a),
    );
    score +=
      (sharedArtists.length /
        Math.max(manga1.artists.length, manga2.artists.length)) *
      0.2;

    if (manga1.type === manga2.type) {
      score += 0.1;
    }

    return score;
  }
}
