import { Injectable, Logger, RequestTimeoutException } from '@nestjs/common';
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

    console.log('template.channels', template.channels, notification);
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
    seenStatus?: 'SEEN' | 'UNSEEN',
  ) {
    this.logger.debug(`Getting paginated notifications for user: ${userId}`);
    if (!userId) {
      this.logger.error('User ID is null or undefined');
      throw new Error('User ID is required');
    }

    const whereClause = {
      recipientId: userId,
      ...(status && { status }),
      ...(seenStatus === 'SEEN' ? { seenAt: { not: null } } : {}),
      ...(seenStatus === 'UNSEEN' ? { seenAt: null } : {}),
    };

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new RequestTimeoutException()), 5000),
      );

      const dataPromise = Promise.all([
        this.prisma.notification.findMany({
          where: whereClause,
          orderBy: {
            createdAt: 'desc',
          },
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.notification.count({
          where: whereClause,
        }),
      ]);

      const [notifications, total] = (await Promise.race([
        dataPromise,
        timeoutPromise,
      ])) as [any[], number];

      this.logger.debug(
        `Found ${notifications.length} notifications out of ${total} total`,
      );

      return {
        data: notifications,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error(`Error in getPaginatedNotifications: ${error.message}`);
      throw error;
    }
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

  async deleteNotification(notificationId: string, userId: string) {
    return this.prisma.notification.delete({
      where: {
        id: notificationId,
        recipientId: userId,
      },
    });
  }

  async bulkDeleteNotifications(notificationIds: string[], userId: string) {
    return this.prisma.notification.deleteMany({
      where: {
        id: { in: notificationIds },
        recipientId: userId,
      },
    });
  }
}
