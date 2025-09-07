import { Injectable, Logger } from '@nestjs/common';
import { MangaNotificationGateway } from '../gateways/manga-notification.gateway';
import { IMangaUpdateData } from '../interfaces/websocket.interface';

@Injectable()
export class MangaNotificationService {
  private readonly logger = new Logger(MangaNotificationService.name);

  constructor(
    private readonly mangaNotificationGateway: MangaNotificationGateway,
  ) {}

  /**
   * Notify all subscribed users about a new manga
   */
  async notifyNewManga(mangaData: IMangaUpdateData): Promise<void> {
    try {
      await this.mangaNotificationGateway.sendNewMangaNotification(mangaData);
      this.logger.log(`Successfully sent new manga notification: ${mangaData.mangaTitle}`);
    } catch (error) {
      this.logger.error(`Failed to send new manga notification: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Notify subscribers about a new chapter for a specific manga
   */
  async notifyNewChapter(mangaData: IMangaUpdateData): Promise<void> {
    try {
      if (!mangaData.chapterNumber || !mangaData.chapterId) {
        throw new Error('Chapter number and chapter ID are required for new chapter notification');
      }

      await this.mangaNotificationGateway.sendNewChapterNotification(mangaData);
      this.logger.log(`Successfully sent new chapter notification: ${mangaData.mangaTitle} - Chapter ${mangaData.chapterNumber}`);
    } catch (error) {
      this.logger.error(`Failed to send new chapter notification: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get statistics about connected users
   */
  getMangaNotificationStats(mangaId?: string): { connectedUsers: number; type: string } {
    if (mangaId) {
      return {
        connectedUsers: this.mangaNotificationGateway.getConnectedUsersForManga(mangaId),
        type: 'specific_manga'
      };
    }

    return {
      connectedUsers: this.mangaNotificationGateway.getTotalConnectedUsers(),
      type: 'general_updates'
    };
  }

  /**
   * Check if the notification service is healthy
   */
  isHealthy(): boolean {
    try {
      return this.mangaNotificationGateway.server !== undefined;
    } catch {
      return false;
    }
  }
}
