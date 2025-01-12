import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  Logger,
  Patch,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationStatus } from '@prisma/client';
import {
  NotificationResponseDto,
  PaginatedNotificationsResponseDto,
} from './dto/notification.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('all')
  @ApiOperation({ summary: 'Get paginated notifications' })
  @ApiResponse({
    status: 200,
    type: PaginatedNotificationsResponseDto,
  })
  async getPaginatedNotifications(
    @Request() req,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: NotificationStatus,
  ) {
    this.logger.debug(`User from request: ${JSON.stringify(req.user)}`);
    if (!req.user?.id) {
      this.logger.error('No user found in request');
      throw new Error('Authentication required');
    }
    return this.notificationsService.getPaginatedNotifications(
      req.user.id,
      +page,
      +limit,
      status,
    );
  }

  @Get('unread')
  @ApiOperation({ summary: 'Get unread notifications' })
  @ApiResponse({
    status: 200,
    description: 'Returns unread notifications',
    type: [NotificationResponseDto],
  })
  async getUnreadNotifications(@Request() req) {
    this.logger.debug(`User from request: ${JSON.stringify(req.user)}`);
    if (!req.user || !req.user.id) {
      this.logger.error('No user found in request');
      throw new Error('Authentication required');
    }
    return this.notificationsService.getUserNotifications(
      req.user.id,
      NotificationStatus.PENDING,
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notifications count' })
  @ApiResponse({
    status: 200,
    description: 'Returns number of unread notifications',
    type: Number,
  })
  async getUnreadCount(@Request() req) {
    this.logger.debug(`User from request: ${JSON.stringify(req.user)}`);
    if (!req.user || !req.user.id) {
      this.logger.error('No user found in request');
      throw new Error('Authentication required');
    }
    return this.notificationsService.getUnreadCount(req.user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({
    status: 200,
    description: 'Notification marked as read',
    type: NotificationResponseDto,
  })
  async markAsRead(@Param('id') notificationId: string, @Request() req) {
    this.logger.debug(`User from request: ${JSON.stringify(req.user)}`);
    if (!req.user || !req.user.id) {
      this.logger.error('No user found in request');
      throw new Error('Authentication required');
    }
    return this.notificationsService.markAsRead(notificationId, req.user.id);
  }

  @Patch('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({
    status: 200,
    description: 'All notifications marked as read',
  })
  async markAllAsRead(@Request() req) {
    this.logger.debug(`User from request: ${JSON.stringify(req.user)}`);
    if (!req.user || !req.user.id) {
      this.logger.error('No user found in request');
      throw new Error('Authentication required');
    }
    return this.notificationsService.markAllAsRead(req.user.id);
  }
}
