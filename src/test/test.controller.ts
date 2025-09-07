import { Controller, Post, Body } from '@nestjs/common';
import { MangaNotificationGateway } from '../shared/websocket/gateways/manga-notification.gateway';

@Controller('test')
export class TestController {
  constructor(
    private readonly mangaNotificationGateway: MangaNotificationGateway,
  ) {}

  @Post('manga-notification')
  async testMangaNotification(@Body() body: any) {
    console.log('🧪 Testing manga notification...');
    
    try {
      await this.mangaNotificationGateway.sendNewMangaNotification({
        mangaId: 'test-manga-id-123',
        mangaTitle: body.title || 'Test Manga Title',
        mangaSlug: body.slug || 'test-manga-slug',
        coverImage: body.coverImage || 'https://example.com/test-cover.jpg',
      });
      
      console.log('✅ Test manga notification sent successfully!');
      
      return {
        success: true,
        message: 'Test manga notification sent successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Failed to send test manga notification:', error);
      
      return {
        success: false,
        message: 'Failed to send test notification',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Post('chapter-notification')
  async testChapterNotification(@Body() body: any) {
    console.log('🧪 Testing chapter notification...');
    
    try {
      await this.mangaNotificationGateway.sendNewChapterNotification({
        mangaId: 'test-manga-id-123',
        mangaTitle: body.mangaTitle || 'Test Manga Title',
        mangaSlug: body.mangaSlug || 'test-manga-slug',
        chapterId: 'test-chapter-id-456',
        chapterNumber: body.chapterNumber || 1,
        chapterTitle: body.chapterTitle || 'Test Chapter Title',
        coverImage: body.coverImage || 'https://example.com/test-cover.jpg',
      });
      
      console.log('✅ Test chapter notification sent successfully!');
      
      return {
        success: true,
        message: 'Test chapter notification sent successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ Failed to send test chapter notification:', error);
      
      return {
        success: false,
        message: 'Failed to send test notification',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Post('websocket-stats')
  async getWebSocketStats() {
    console.log('📊 Getting WebSocket stats...');
    
    try {
      const connectedUsers = this.mangaNotificationGateway.getTotalConnectedUsers();
      
      return {
        success: true,
        stats: {
          totalConnectedUsers: connectedUsers,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('❌ Failed to get WebSocket stats:', error);
      
      return {
        success: false,
        message: 'Failed to get stats',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
