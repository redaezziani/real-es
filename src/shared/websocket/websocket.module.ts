import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MangaNotificationGateway } from './gateways/manga-notification.gateway';
import { MangaNotificationService } from './services/manga-notification.service';
import { NotificationTestController } from './controllers/notification-test.controller';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [NotificationTestController],
  providers: [
    MangaNotificationGateway,
    MangaNotificationService,
  ],
  exports: [
    MangaNotificationGateway,
    MangaNotificationService,
  ],
})
export class WebSocketModule {}
