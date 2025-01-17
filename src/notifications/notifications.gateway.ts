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
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(NotificationsGateway.name);
  private userSockets: Map<string, string[]> = new Map();

  handleConnection(client: Socket) {
    this.logger.log(`Client attempting to connect: ${client.id}`);
    this.logger.debug('Connection headers:', client.handshake.headers);
    this.logger.debug('Connection query:', client.handshake.query);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.logger.debug('Disconnect reason:', client.disconnected);
    this.removeSocket(client);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(client: Socket) {
    this.logger.debug('Subscribe attempt from client:', client.id);
    this.logger.debug('Client user data:', client['user']);
    
    const userId = client['user']?.id;
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

  async sendNotificationToUser(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('notification', notification);
  }

  async sendBroadcast(notification: any) {
    this.server.emit('notification', notification);
  }

  async sendMangaNotification(notification: any) {
    this.server.to('manga-updates').emit('manga-notification', notification);
  }
}
