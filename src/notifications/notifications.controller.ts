import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
  Logger,
  HttpStatus,
  HttpException,
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

  @Get() // Change from 'all' to root path
  @ApiOperation({ summary: 'Get paginated notifications' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved notifications',
    type: PaginatedNotificationsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getPaginatedNotifications(
    @Request() req,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: NotificationStatus,
  ) {
    try {
      this.logger.debug(`Getting notifications for user: ${req.user?.id}`);
      if (!req.user?.id) {
        throw new HttpException(
          'User not authenticated',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const result = await this.notificationsService.getPaginatedNotifications(
        req.user.id,
        +page,
        +limit,
        status,
      );

      this.logger.debug(`Found ${result.data.length} notifications`);
      return result;
    } catch (error) {
      this.logger.error(`Error in getPaginatedNotifications: ${error.message}`);
      throw new HttpException(
        error.message || 'Internal server error',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
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
    this.logger.debug(`Getting unread count for user: ${req.user.id}`);
    try {
      return await this.notificationsService.getUnreadCount(req.user.id);
    } catch (error) {
      this.logger.error(`Error fetching unread count: ${error.message}`);
      throw error;
    }
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
