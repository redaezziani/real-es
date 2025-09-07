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
  async handleMangaPublishedEvent(payload: { mangaId: string; isPublished: boolean }) {
    console.log('📢 Manga published event received:', payload);
    
    // Only send notification if manga is being published (not unpublished)
    if (payload.isPublished) {
      try {
        // Fetch the manga details to send in the notification
        const manga = await this.prismaService.manga.findUnique({
          where: { id: payload.mangaId },
          select: {
            id: true,
            title: true,
            slug: true,
            cover: true,
            description: true,
            authors: true,
            artists: true,
          }
        });

        if (manga) {
          // Send notification to all users subscribed to manga updates
          await this.mangaNotificationGateway.sendMangaPublishedNotification({
            mangaId: manga.id,
            mangaTitle: manga.title,
            mangaSlug: manga.slug,
            coverImage: manga.cover,
            author: manga.authors.join(', '),
            artist: manga.artists.join(', '),
            description: manga.description,
          });

          console.log(`✅ WebSocket notification sent for published manga: ${manga.title}`);
        }
      } catch (error) {
        console.error('❌ Error sending manga publication notification:', error);
      }
    } else {
      console.log('📢 Manga unpublished, no notification sent');
    }
  }
}