import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationStatus, NotificationPriority } from '@prisma/client';
import { NotificationTemplates } from './templates/notification.templates';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsGateway: NotificationsGateway,
  ) {}

  async createAndSendNotification(
    recipientId: string,
    type: string,
    data: any,
    priority: NotificationPriority = NotificationPriority.MEDIUM,
  ) {
    const template = NotificationTemplates[type];
    if (!template) {
      throw new Error(`Notification template ${type} not found`);
    }

    const notification = await this.prisma.notification.create({
      data: {
        type,
        title: template.title(data),
        message: template.message(data),
        data,
        channels: template.channels,
        recipientId,
        priority,
        status: NotificationStatus.PENDING,
      },
    });

    // Send real-time notification if IN_APP is included in channels
    if (template.channels.includes('IN_APP')) {
      await this.notificationsGateway.sendNotificationToUser(
        recipientId,
        notification,
      );
    }

    return notification;
  }

  async markAsRead(notificationId: string, userId: string) {
    return this.prisma.notification.update({
      where: {
        id: notificationId,
        recipientId: userId,
      },
      data: {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    });
  }

  async getUserNotifications(userId: string, status?: NotificationStatus) {
    this.logger.debug(`Getting notifications for user: ${userId}`);
    if (!userId) {
      this.logger.error('User ID is null or undefined');
      throw new Error('User ID is required');
    }
    console.log('userId', userId);
    return this.prisma.notification.findMany({
      where: {
        recipientId: userId,
        ...(status && { status }),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: {
        recipientId: userId,
        status: NotificationStatus.PENDING,
      },
    });
  }

  async getPaginatedNotifications(
    userId: string,
    page: number,
    limit: number,
    status?: NotificationStatus,
  ) {
    this.logger.debug(`Getting paginated notifications for user: ${userId}`);
    if (!userId) {
      this.logger.error('User ID is null or undefined');
      throw new Error('User ID is required');
    }

    const skip = (page - 1) * limit;
    console.log('the current user:', userId);
    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: {
          recipientId: userId,
          ...(status && { status }),
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({
        where: {
          recipientId: userId,
          ...(status && { status }),
        },
      }),
    ]);

    return {
      data: notifications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        recipientId: userId,
        status: NotificationStatus.PENDING,
      },
      data: {
        status: NotificationStatus.READ,
        readAt: new Date(),
      },
    });
  }
}
