# Manga Notification WebSocket Gateway

This WebSocket gateway provides real-time notifications for manga updates, including new manga additions and new chapter releases.

## Features

- **Real-time notifications** for new manga and chapter updates
- **User authentication** via JWT tokens
- **Subscription management** for specific manga or general updates
- **Event-driven architecture** integration
- **Multiple notification channels** (general updates, manga-specific)

## WebSocket Namespace

The gateway operates on the `/manga-notifications` namespace.

## Connection

### Client Connection
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000/manga-notifications', {
  auth: {
    token: 'your-jwt-token'
  },
  // Alternative: pass token as query parameter
  query: {
    auth_token: 'your-jwt-token'
  }
});
```

### Authentication
The gateway uses JWT authentication. You can provide the token in two ways:
1. **Authorization header**: `Bearer your-jwt-token`
2. **Query parameter**: `auth_token=your-jwt-token`

## Events

### Client to Server Events

#### Subscribe to General Manga Updates
```javascript
socket.emit('subscribe-to-manga-updates');
```

#### Subscribe to Specific Manga
```javascript
socket.emit('subscribe-to-specific-manga', {
  mangaId: 'manga-id-here'
});
```

#### Unsubscribe from Specific Manga
```javascript
socket.emit('unsubscribe-from-specific-manga', {
  mangaId: 'manga-id-here'
});
```

#### Get Current Subscriptions
```javascript
socket.emit('get-subscriptions');
```

### Server to Client Events

#### New Manga Notification
```javascript
socket.on('new-manga', (notification) => {
  console.log('New manga added:', notification);
  // notification structure:
  // {
  //   id: 'manga-123-1693834567890',
  //   type: 'new_manga',
  //   mangaId: '123',
  //   mangaTitle: 'One Piece',
  //   mangaSlug: 'one-piece',
  //   coverImage: 'https://...',
  //   timestamp: '2023-09-04T12:00:00.000Z',
  //   message: 'New manga "One Piece" has been added!'
  // }
});
```

#### New Chapter Notification
```javascript
socket.on('new-chapter', (notification) => {
  console.log('New chapter available:', notification);
  // notification structure:
  // {
  //   id: 'chapter-456-1693834567890',
  //   type: 'new_chapter',
  //   mangaId: '123',
  //   mangaTitle: 'One Piece',
  //   mangaSlug: 'one-piece',
  //   chapterNumber: 1090,
  //   chapterTitle: 'Kizaru',
  //   chapterId: '456',
  //   coverImage: 'https://...',
  //   timestamp: '2023-09-04T12:00:00.000Z',
  //   message: 'New chapter 1090: Kizaru for "One Piece" is available!'
  // }
});
```

#### General Manga Notifications
```javascript
socket.on('manga-notification', (notification) => {
  console.log('Manga notification:', notification);
});
```

## Backend Usage

### Emitting Events for Notifications

The system uses an event-driven approach. When manga or chapters are created, emit events that the notification handler will catch:

```typescript
// In your manga service or scraper service
import { EventEmitter2 } from '@nestjs/event-emitter';

class MangaService {
  constructor(private eventEmitter: EventEmitter2) {}

  async createManga(mangaData: any) {
    // Create manga logic here...
    const createdManga = await this.prisma.manga.create({
      data: mangaData
    });

    // Emit event for notifications
    this.eventEmitter.emit('manga.created', {
      id: createdManga.id,
      title: createdManga.title,
      slug: createdManga.slug,
      coverImage: createdManga.coverImage,
      description: createdManga.description
    });

    return createdManga;
  }

  async createChapter(chapterData: any) {
    // Create chapter logic here...
    const createdChapter = await this.prisma.chapter.create({
      data: chapterData,
      include: { manga: true }
    });

    // Emit event for notifications
    this.eventEmitter.emit('chapter.created', {
      id: createdChapter.id,
      mangaId: createdChapter.mangaId,
      mangaTitle: createdChapter.manga.title,
      mangaSlug: createdChapter.manga.slug,
      chapterNumber: createdChapter.chapterNumber,
      chapterTitle: createdChapter.chapterTitle,
      coverImage: createdChapter.manga.coverImage
    });

    return createdChapter;
  }
}
```

### Direct Service Usage

You can also inject the notification service directly:

```typescript
import { MangaNotificationService, IMangaUpdateData } from '../shared/websocket';

class SomeService {
  constructor(
    private mangaNotificationService: MangaNotificationService
  ) {}

  async notifyNewManga(mangaData: IMangaUpdateData) {
    await this.mangaNotificationService.notifyNewManga(mangaData);
  }

  async notifyNewChapter(chapterData: IMangaUpdateData) {
    await this.mangaNotificationService.notifyNewChapter(chapterData);
  }
}
```

## Frontend Integration Examples

### React Hook Example

```typescript
import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';

interface MangaNotification {
  id: string;
  type: 'new_manga' | 'new_chapter';
  mangaId: string;
  mangaTitle: string;
  message: string;
  timestamp: Date;
}

export const useMangaNotifications = (token: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<MangaNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket = io('/manga-notifications', {
      auth: { token }
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      // Subscribe to general manga updates
      newSocket.emit('subscribe-to-manga-updates');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('new-manga', (notification: MangaNotification) => {
      setNotifications(prev => [notification, ...prev]);
    });

    newSocket.on('new-chapter', (notification: MangaNotification) => {
      setNotifications(prev => [notification, ...prev]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  const subscribeToManga = (mangaId: string) => {
    socket?.emit('subscribe-to-specific-manga', { mangaId });
  };

  const unsubscribeFromManga = (mangaId: string) => {
    socket?.emit('unsubscribe-from-specific-manga', { mangaId });
  };

  return {
    notifications,
    isConnected,
    subscribeToManga,
    unsubscribeFromManga
  };
};
```

### Vue Composition API Example

```typescript
import { ref, onMounted, onUnmounted } from 'vue';
import io, { Socket } from 'socket.io-client';

export function useMangaNotifications(token: string) {
  const socket = ref<Socket | null>(null);
  const notifications = ref<any[]>([]);
  const isConnected = ref(false);

  onMounted(() => {
    socket.value = io('/manga-notifications', {
      auth: { token }
    });

    socket.value.on('connect', () => {
      isConnected.value = true;
      socket.value?.emit('subscribe-to-manga-updates');
    });

    socket.value.on('disconnect', () => {
      isConnected.value = false;
    });

    socket.value.on('new-manga', (notification) => {
      notifications.value.unshift(notification);
    });

    socket.value.on('new-chapter', (notification) => {
      notifications.value.unshift(notification);
    });
  });

  onUnmounted(() => {
    socket.value?.disconnect();
  });

  const subscribeToManga = (mangaId: string) => {
    socket.value?.emit('subscribe-to-specific-manga', { mangaId });
  };

  return {
    notifications,
    isConnected,
    subscribeToManga
  };
}
```

## Environment Variables

Make sure to set up your JWT secret in environment variables:

```bash
JWT_SECRET=your-secret-key-here
```

## Monitoring

The service provides methods to monitor connected users:

```typescript
// Get connected users for a specific manga
const connectedUsers = mangaNotificationGateway.getConnectedUsersForManga('manga-id');

// Get total connected users for general updates
const totalUsers = mangaNotificationGateway.getTotalConnectedUsers();

// Check service health
const isHealthy = mangaNotificationService.isHealthy();
```

## Error Handling

The gateway handles various error scenarios:
- **Authentication failures**: Invalid or expired JWT tokens
- **Missing user data**: Malformed token payload
- **Connection issues**: Automatic reconnection on client side recommended

## Security Notes

- Always validate JWT tokens on the server side
- Implement rate limiting for WebSocket connections
- Consider implementing user-specific rate limits for subscriptions
- Monitor for suspicious connection patterns
