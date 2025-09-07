import { Controller, Post, Body, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MangaNotificationService } from '../services/manga-notification.service';
import { IMangaUpdateData } from '../interfaces/websocket.interface';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationTestController {
  constructor(
    private readonly mangaNotificationService: MangaNotificationService,
  ) {}

  @Post('test/new-manga')
  @ApiOperation({ summary: 'Test new manga notification' })
  @ApiResponse({ status: 200, description: 'Notification sent successfully' })
  async testNewMangaNotification(@Body() mangaData: IMangaUpdateData) {
    try {
      await this.mangaNotificationService.notifyNewManga(mangaData);
      
      return {
        statusCode: HttpStatus.OK,
        message: 'New manga notification sent successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to send notification',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Post('test/new-chapter')
  @ApiOperation({ summary: 'Test new chapter notification' })
  @ApiResponse({ status: 200, description: 'Notification sent successfully' })
  async testNewChapterNotification(@Body() chapterData: IMangaUpdateData) {
    try {
      await this.mangaNotificationService.notifyNewChapter(chapterData);
      
      return {
        statusCode: HttpStatus.OK,
        message: 'New chapter notification sent successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to send notification',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Post('stats')
  @ApiOperation({ summary: 'Get notification statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getNotificationStats(@Body() body?: { mangaId?: string }) {
    try {
      const stats = this.mangaNotificationService.getMangaNotificationStats(body?.mangaId);
      
      return {
        statusCode: HttpStatus.OK,
        data: stats,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to get statistics',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}