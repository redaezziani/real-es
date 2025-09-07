import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { MangaNotificationGateway } from "../shared/websocket/gateways/manga-notification.gateway";
import { PrismaService } from "../shared/prisma.service";

@Injectable()
export class MangaEvents {
  constructor(
    private readonly mangaNotificationGateway: MangaNotificationGateway,
    private readonly prismaService: PrismaService,
  ) {}

  @OnEvent('manga.published')
  async handleMangaPublishedEvent(payload: {
    mangaId: string;
    mangaTitle: string;
    mangaSlug?: string;
    coverImage?: string;
    author?: string;
    artist?: string;
    description?: string;
    isPublished: boolean;
  }) {
    
    if (payload.isPublished) {
      try {
        
        if (payload.mangaId && payload.mangaTitle) {
          await this.mangaNotificationGateway.sendMangaPublishedNotification({
            mangaId: payload.mangaId,
            mangaTitle: payload.mangaTitle,
            mangaSlug: payload.mangaSlug,
            coverImage: payload.coverImage,
            author: payload.author,
            artist: payload.artist,
            description: payload.description,
          });

          console.log(`✅ WebSocket notification sent for published manga: ${payload.mangaTitle}`);
        }
      } catch (error) {
        console.error('❌ Error sending manga publication notification:', error);
      }
    } else {
      console.log('📢 Manga unpublished, no notification sent');
    }
  }

  @OnEvent('chapter.published')
  async handleChapterPublishedEvent(payload: {
    chapterId: string;
    chapterNumber: number;
    chapterTitle: string;
    mangaId: string;
    mangaTitle: string;
    mangaSlug?: string;
    coverImage?: string;
    isPublished: boolean;
  }) {
    
    if (payload.isPublished) {
      try {
        if (payload.chapterId && payload.mangaId) {
          await this.mangaNotificationGateway.sendNewChapterNotification({
            mangaId: payload.mangaId,
            mangaTitle: payload.mangaTitle,
            mangaSlug: payload.mangaSlug,
            coverImage: payload.coverImage,
            chapterNumber: payload.chapterNumber,
            chapterTitle: payload.chapterTitle,
            chapterId: payload.chapterId,
          });

          console.log(`✅ WebSocket notification sent for published chapter: ${payload.chapterTitle} of ${payload.mangaTitle}`);
        }
      } catch (error) {
        console.error('❌ Error sending chapter publication notification:', error);
      }
    } else {
      console.log('📢 Chapter unpublished, no notification sent');
    }
  }

}