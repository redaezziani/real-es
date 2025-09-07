import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'ws';
import { Logger, UseGuards } from '@nestjs/common';
import { WsAuthGuard } from './ws-auth.guard';
import { JwtService } from '@nestjs/jwt';
import * as WebSocket from 'ws';

@WebSocketGateway({
  path: '/notifications',
})
@UseGuards(WsAuthGuard)
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private jwtService: JwtService) {}

  @WebSocketServer() server: Server;
  private readonly logger = new Logger(NotificationsGateway.name);
  private userSockets: Map<string, WebSocket[]> = new Map();
  private authenticatedClients: Map<WebSocket, any> = new Map();

  async handleConnection(client: WebSocket, request: any) {
    try {
      const token = this.extractToken(request);
      if (!token) {
        this.logger.error('No token provided');
        client.close(4001, 'No authentication token provided');
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      this.authenticatedClients.set(client, payload);

      // Set up message handler
      client.on('message', (data) => {
        this.handleMessage(client, data);
      });

      this.logger.log(`Client authenticated and connected: ${payload.sub}`);
      this.logger.debug('User data:', payload);
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
      const message = JSON.parse(data.toString());
      this.logger.debug(`Received message: ${message.event}`, message.data);

      switch (message.event) {
        case 'subscribe':
          this.handleSubscribe(client);
          break;
        default:
          this.logger.warn(`Unknown message event: ${message.event}`);
      }
    } catch (error) {
      this.logger.error('Error parsing message:', error);
    }
  }

  private handleSubscribe(client: WebSocket) {
    const user = this.authenticatedClients.get(client);
    this.logger.debug('Subscribe attempt from client:', user?.sub);
    this.logger.debug('Client user data:', user);

    const userId = user?.sub;
    if (!userId) {
      this.logger.error('No user ID found in socket client');
      client.send(JSON.stringify({ event: 'error', data: { message: 'User ID not found' } }));
      return;
    }

    this.addSocket(userId, client);

    this.logger.log(`User ${userId} subscribed to notifications`);
    client.send(JSON.stringify({ event: 'subscribed', data: { status: 'subscribed' } }));
  }

  private addSocket(userId: string, client: WebSocket) {
    const userSockets = this.userSockets.get(userId) || [];
    userSockets.push(client);
    this.userSockets.set(userId, userSockets);
  }

  private removeSocket(client: WebSocket) {
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

  async sendNotificationToUser(userId: string, notification: any) {
    const userSockets = this.userSockets.get(userId);
    if (userSockets) {
      userSockets.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ event: 'notification', data: notification }));
        }
      });
    }
  }

  async sendBroadcast(notification: any) {
    this.userSockets.forEach((sockets) => {
      sockets.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ event: 'notification', data: notification }));
        }
      });
    });
  }

  async sendMangaNotification(notification: any) {
    // Send to all connected users for now (could be improved with specific manga subscriptions)
    this.userSockets.forEach((sockets) => {
      sockets.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ event: 'manga-notification', data: notification }));
        }
      });
    });
  }
}
