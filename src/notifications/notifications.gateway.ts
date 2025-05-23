import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { WsAuthGuard } from './ws-auth.guard';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'notifications',
})
@UseGuards(WsAuthGuard)
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private jwtService: JwtService) {}

  @WebSocketServer() server: Server;
  private readonly logger = new Logger(NotificationsGateway.name);
  private userSockets: Map<string, string[]> = new Map();

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        this.logger.error('No token provided');
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      client['user'] = payload;

      this.logger.log(`Client authenticated and connected: ${client.id}`);
      this.logger.debug('User data:', client['user']);
    } catch (error) {
      this.logger.error('Authentication failed:', error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.logger.debug('Disconnect reason:', client.disconnected);
    this.removeSocket(client);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(client: Socket) {
    this.logger.debug('Subscribe attempt from client:', client['user']?.sub);
    this.logger.debug('Client user data:', client['user']);

    const userId = client['user']?.sub;
    if (!userId) {
      this.logger.error('No user ID found in socket client');
      throw new WsException('User ID not found');
    }

    this.addSocket(userId, client.id);
    client.join(`user:${userId}`);

    // Also join manga notifications channel
    client.join('manga-updates');

    this.logger.log(`User ${userId} subscribed to notifications`);
    return { status: 'subscribed' };
  }

  private addSocket(userId: string, socketId: string) {
    const userSocketIds = this.userSockets.get(userId) || [];
    userSocketIds.push(socketId);
    this.userSockets.set(userId, userSocketIds);
  }

  private removeSocket(client: Socket) {
    this.userSockets.forEach((sockets, userId) => {
      const index = sockets.indexOf(client.id);
      if (index !== -1) {
        sockets.splice(index, 1);
        if (sockets.length === 0) {
          this.userSockets.delete(userId);
        }
      }
    });
  }

  private extractToken(client: Socket): string | undefined {
    // Try to get token from headers first
    const authHeader = client.handshake.headers.authorization;
    if (authHeader) {
      const [type, token] = authHeader.split(' ');
      if (type === 'Bearer') return token;
    }

    // If not in headers, try query parameters
    const queryToken = client.handshake.query.auth_token;
    if (queryToken) {
      // Clean the token if it has quotes
      const token = Array.isArray(queryToken) ? queryToken[0] : queryToken;
      return token.replace(/^["'](.+)["']$/, '$1');
    }

    return undefined;
  }

  async sendNotificationToUser(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('notification', notification);
  }

  async sendBroadcast(notification: any) {
    this.server.emit('notification', notification);
  }

  async sendMangaNotification(notification: any) {
    // this is mean to be a private channel for manga updates
    this.server.to('manga-updates').emit('manga-notification', notification);
  }
}
