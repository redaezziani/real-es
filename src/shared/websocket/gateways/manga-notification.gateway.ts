import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server } from 'ws';
import { Logger, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { 
  IMangaNotificationPayload, 
  IWebSocketUser, 
  IWebSocketResponse,
  IMangaUpdateData 
} from '../interfaces/websocket.interface';
import { URL } from 'url';
import * as WebSocket from 'ws';

interface WebSocketMessage {
  event: string;
  data?: any;
}

@Injectable()
@WebSocketGateway({
  path: '/manga-notifications',
})
export class MangaNotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(MangaNotificationGateway.name);
  
  // Store authenticated clients
  private authenticatedClients: Map<WebSocket, IWebSocketUser> = new Map();
  
  // Store user socket connections
  private userSockets: Map<string, WebSocket[]> = new Map();
  
  // Store manga subscriptions per user
  private mangaSubscriptions: Map<string, Set<string>> = new Map();
  
  // Store room subscriptions
  private roomSubscriptions: Map<string, Set<WebSocket>> = new Map();

  constructor(private jwtService: JwtService) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket server initialized');
  }

  async handleConnection(client: WebSocket, request: any) {
    try {
      const token = this.extractToken(request);
      if (!token) {
        this.logger.error('No token provided');
        client.close(4001, 'No authentication token provided');
        return;
      }

      const payload = await this.jwtService.verifyAsync<IWebSocketUser>(token);
      this.authenticatedClients.set(client, payload);

      this.addSocket(payload.sub, client);
      this.logger.log(`Client authenticated and connected for user: ${payload.sub}`);

      // Set up message handler
      client.on('message', (data) => {
        this.handleMessage(client, data);
      });

      // Send connection success message
      this.sendMessage(client, {
        event: 'connected',
        data: { status: 'success', message: 'Connected successfully' }
      });

    } catch (error) {
      this.logger.error('Authentication failed:', error.message);
      client.close(4001, 'Authentication failed');
    }
  }

  handleDisconnect(client: WebSocket) {
    this.logger.log(`Client disconnected`);
    this.removeSocket(client);
    this.authenticatedClients.delete(client);
  }

  private handleMessage(client: WebSocket, data: WebSocket.Data) {
    try {
      const message: WebSocketMessage = JSON.parse(data.toString());
      this.logger.debug(`Received message: ${message.event}`, message.data);

      switch (message.event) {
        case 'subscribe-to-manga-updates':
          this.handleSubscribeToMangaUpdates(client);
          break;
        case 'subscribe-to-specific-manga':
          this.handleSubscribeToSpecificManga(client, message.data);
          break;
        case 'unsubscribe-from-specific-manga':
          this.handleUnsubscribeFromSpecificManga(client, message.data);
          break;
        case 'get-subscriptions':
          this.handleGetSubscriptions(client);
          break;
        case 'ping':
          this.sendMessage(client, { event: 'pong' });
          break;
        default:
          this.logger.warn(`Unknown message event: ${message.event}`);
      }
    } catch (error) {
      this.logger.error('Error parsing message:', error);
      this.sendMessage(client, {
        event: 'error',
        data: { status: 'error', message: 'Invalid message format' }
      });
    }
  }

  private handleSubscribeToMangaUpdates(client: WebSocket): void {
    const user = this.authenticatedClients.get(client);
    if (!user) {
      this.sendMessage(client, {
        event: 'error',
        data: { status: 'error', message: 'User not authenticated' }
      });
      return;
    }

    this.addToRoom('manga-updates', client);
    this.logger.log(`User ${user.sub} subscribed to general manga updates`);
    
    this.sendMessage(client, {
      event: 'subscribe-to-manga-updates',
      data: { 
        status: 'success', 
        message: 'Subscribed to manga updates',
        room: 'manga-updates'
      }
    });
  }

  private handleSubscribeToSpecificManga(client: WebSocket, data: any): void {
    const user = this.authenticatedClients.get(client);
    if (!user) {
      this.sendMessage(client, {
        event: 'error',
        data: { status: 'error', message: 'User not authenticated' }
      });
      return;
    }

    if (!data?.mangaId) {
      this.sendMessage(client, {
        event: 'error',
        data: { status: 'error', message: 'Manga ID is required' }
      });
      return;
    }

    const roomName = `manga:${data.mangaId}`;
    this.addToRoom(roomName, client);

    // Track user's manga subscriptions
    if (!this.mangaSubscriptions.has(user.sub)) {
      this.mangaSubscriptions.set(user.sub, new Set());
    }
    this.mangaSubscriptions.get(user.sub)!.add(data.mangaId);

    this.logger.log(`User ${user.sub} subscribed to manga ${data.mangaId}`);
    
    this.sendMessage(client, {
      event: 'subscribe-to-specific-manga',
      data: { 
        status: 'success', 
        message: `Subscribed to manga ${data.mangaId}`,
        mangaId: data.mangaId,
        room: roomName
      }
    });
  }

  private handleUnsubscribeFromSpecificManga(client: WebSocket, data: any): void {
    const user = this.authenticatedClients.get(client);
    if (!user) {
      this.sendMessage(client, {
        event: 'error',
        data: { status: 'error', message: 'User not authenticated' }
      });
      return;
    }

    if (!data?.mangaId) {
      this.sendMessage(client, {
        event: 'error',
        data: { status: 'error', message: 'Manga ID is required' }
      });
      return;
    }

    const roomName = `manga:${data.mangaId}`;
    this.removeFromRoom(roomName, client);

    // Remove from user's manga subscriptions
    if (this.mangaSubscriptions.has(user.sub)) {
      this.mangaSubscriptions.get(user.sub)!.delete(data.mangaId);
    }

    this.logger.log(`User ${user.sub} unsubscribed from manga ${data.mangaId}`);
    
    this.sendMessage(client, {
      event: 'unsubscribe-from-specific-manga',
      data: { 
        status: 'success', 
        message: `Unsubscribed from manga ${data.mangaId}`,
        mangaId: data.mangaId
      }
    });
  }

  private handleGetSubscriptions(client: WebSocket): void {
    const user = this.authenticatedClients.get(client);
    if (!user) {
      this.sendMessage(client, {
        event: 'error',
        data: { status: 'error', message: 'User not authenticated' }
      });
      return;
    }

    const subscriptions = Array.from(this.mangaSubscriptions.get(user.sub) || []);
    
    this.sendMessage(client, {
      event: 'get-subscriptions',
      data: { 
        status: 'success', 
        subscriptions
      }
    });
  }

  // Public methods for sending notifications

  /**
   * Send notification when a new manga is added
   */
  async sendNewMangaNotification(mangaData: IMangaUpdateData): Promise<void> {
    const notification: IMangaNotificationPayload = {
      id: `manga-${mangaData.mangaId}-${Date.now()}`,
      type: 'new_manga',
      mangaId: mangaData.mangaId,
      mangaTitle: mangaData.mangaTitle,
      mangaSlug: mangaData.mangaSlug,
      coverImage: mangaData.coverImage,
      timestamp: new Date(),
      message: `New manga "${mangaData.mangaTitle}" has been added!`
    };

    // Send to all users subscribed to manga updates
    this.broadcastToRoom('manga-updates', {
      event: 'new-manga',
      data: notification
    });
    
    this.logger.log(`Sent new manga notification: ${mangaData.mangaTitle}`);
  }

  /**
   * Send notification when a new chapter is added to a manga
   */
  async sendNewChapterNotification(mangaData: IMangaUpdateData): Promise<void> {
    const notification: IMangaNotificationPayload = {
      id: `chapter-${mangaData.chapterId}-${Date.now()}`,
      type: 'new_chapter',
      mangaId: mangaData.mangaId,
      mangaTitle: mangaData.mangaTitle,
      mangaSlug: mangaData.mangaSlug,
      chapterNumber: mangaData.chapterNumber,
      chapterTitle: mangaData.chapterTitle,
      chapterId: mangaData.chapterId,
      coverImage: mangaData.coverImage,
      timestamp: new Date(),
      message: `New chapter ${mangaData.chapterNumber}${mangaData.chapterTitle ? `: ${mangaData.chapterTitle}` : ''} for "${mangaData.mangaTitle}" is available!`
    };

    // Send to users subscribed to this specific manga
    const specificRoom = `manga:${mangaData.mangaId}`;
    this.broadcastToRoom(specificRoom, {
      event: 'new-chapter',
      data: notification
    });

    // Also send to general manga updates room
    this.broadcastToRoom('manga-updates', {
      event: 'new-chapter',
      data: notification
    });

    this.logger.log(`Sent new chapter notification for manga: ${mangaData.mangaTitle}, chapter: ${mangaData.chapterNumber}`);
  }

  /**
   * Send a custom manga notification
   */
  async sendCustomMangaNotification(notification: IMangaNotificationPayload, roomName?: string): Promise<void> {
    const targetRoom = roomName || 'manga-updates';
    this.broadcastToRoom(targetRoom, {
      event: 'manga-notification',
      data: notification
    });
    this.logger.log(`Sent custom manga notification to room: ${targetRoom}`);
  }

  /**
   * Get connected users count for a specific manga
   */
  getConnectedUsersForManga(mangaId: string): number {
    const room = this.roomSubscriptions.get(`manga:${mangaId}`);
    return room ? room.size : 0;
  }

  /**
   * Get total connected users for manga updates
   */
  getTotalConnectedUsers(): number {
    const room = this.roomSubscriptions.get('manga-updates');
    return room ? room.size : 0;
  }

  // Private helper methods

  private sendMessage(client: WebSocket, message: WebSocketMessage): void {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(JSON.stringify(message));
      } catch (error) {
        this.logger.error('Error sending message to client:', error);
      }
    }
  }

  private broadcastToRoom(roomName: string, message: WebSocketMessage): void {
    const room = this.roomSubscriptions.get(roomName);
    if (room) {
      room.forEach(client => {
        this.sendMessage(client, message);
      });
    }
  }

  private addToRoom(roomName: string, client: WebSocket): void {
    if (!this.roomSubscriptions.has(roomName)) {
      this.roomSubscriptions.set(roomName, new Set());
    }
    this.roomSubscriptions.get(roomName)!.add(client);
  }

  private removeFromRoom(roomName: string, client: WebSocket): void {
    const room = this.roomSubscriptions.get(roomName);
    if (room) {
      room.delete(client);
      if (room.size === 0) {
        this.roomSubscriptions.delete(roomName);
      }
    }
  }

  private addSocket(userId: string, client: WebSocket): void {
    const userSockets = this.userSockets.get(userId) || [];
    userSockets.push(client);
    this.userSockets.set(userId, userSockets);
  }

  private removeSocket(client: WebSocket): void {
    const user = this.authenticatedClients.get(client);
    
    this.userSockets.forEach((sockets, userId) => {
      const index = sockets.indexOf(client);
      if (index !== -1) {
        sockets.splice(index, 1);
        if (sockets.length === 0) {
          this.userSockets.delete(userId);
        }
      }
    });

    // Remove from all rooms
    this.roomSubscriptions.forEach((clients, roomName) => {
      clients.delete(client);
      if (clients.size === 0) {
        this.roomSubscriptions.delete(roomName);
      }
    });

    // Clean up manga subscriptions if user has no more sockets
    if (user && (!this.userSockets.has(user.sub) || this.userSockets.get(user.sub)!.length === 0)) {
      this.mangaSubscriptions.delete(user.sub);
    }
  }

  private extractToken(request: any): string | undefined {
    try {
      // Try to get token from URL query parameters
      const url = new URL(request.url, `http://${request.headers.host}`);
      const authToken = url.searchParams.get('auth_token');
      
      if (authToken) {
        // Clean the token if it has quotes
        return authToken.replace(/^["'](.+)["']$/, '$1');
      }

      // Try to get token from headers
      const authHeader = request.headers.authorization;
      if (authHeader) {
        const [type, token] = authHeader.split(' ');
        if (type === 'Bearer') return token;
      }

      return undefined;
    } catch (error) {
      this.logger.error('Error extracting token:', error);
      return undefined;
    }
  }
}
