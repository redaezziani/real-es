import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MangaNotificationService } from '../shared/websocket';
import { IMangaUpdateData } from '../shared/websocket';

@Injectable()
export class MangaNotificationEventHandler {
  private readonly logger = new Logger(MangaNotificationEventHandler.name);

  constructor(
    private readonly mangaNotificationService: MangaNotificationService,
  ) {}

  // Listen for manga creation events
  @OnEvent('manga.created')
  async handleMangaCreated(payload: any) {
    try {
      const mangaData: IMangaUpdateData = {
        mangaId: payload.id,
        mangaTitle: payload.title,
        mangaSlug: payload.slug,
        coverImage: payload.coverImage,
        description: payload.description,
      };

      await this.mangaNotificationService.notifyNewManga(mangaData);
      this.logger.log(`Sent new manga notification for: ${payload.title}`);
    } catch (error) {
      this.logger.error(`Failed to send manga notification: ${error.message}`, error.stack);
    }
  }

  // Listen for chapter creation events
  @OnEvent('chapter.created')
  async handleChapterCreated(payload: any) {
    try {
      const mangaData: IMangaUpdateData = {
        mangaId: payload.mangaId,
        mangaTitle: payload.mangaTitle,
        mangaSlug: payload.mangaSlug,
        chapterNumber: payload.chapterNumber,
        chapterTitle: payload.chapterTitle,
        chapterId: payload.id,
        coverImage: payload.coverImage,
      };

      await this.mangaNotificationService.notifyNewChapter(mangaData);
      this.logger.log(`Sent new chapter notification for: ${payload.mangaTitle} - Chapter ${payload.chapterNumber}`);
    } catch (error) {
      this.logger.error(`Failed to send chapter notification: ${error.message}`, error.stack);
    }
  }

  // Listen for multiple chapters created at once
  @OnEvent('chapters.created')
  async handleChaptersCreated(payload: { chapters: any[]; manga: any }) {
    try {
      for (const chapter of payload.chapters) {
        const mangaData: IMangaUpdateData = {
          mangaId: payload.manga.id,
          mangaTitle: payload.manga.title,
          mangaSlug: payload.manga.slug,
          chapterNumber: chapter.chapterNumber,
          chapterTitle: chapter.chapterTitle,
          chapterId: chapter.id,
          coverImage: payload.manga.coverImage,
        };

        await this.mangaNotificationService.notifyNewChapter(mangaData);
      }

      this.logger.log(`Sent ${payload.chapters.length} chapter notifications for: ${payload.manga.title}`);
    } catch (error) {
      this.logger.error(`Failed to send chapters notification: ${error.message}`, error.stack);
    }
  }
}
