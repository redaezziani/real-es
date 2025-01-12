import { ApiProperty } from '@nestjs/swagger';
import { NotificationStatus, NotificationPriority } from '@prisma/client';
import { IsEnum, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class GetNotificationsQueryDto {
  @ApiProperty({
    required: false,
    default: 1,
    description: 'Page number',
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({
    required: false,
    default: 10,
    description: 'Number of items per page',
    minimum: 1,
    maximum: 100,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;

  @ApiProperty({
    required: false,
    enum: NotificationStatus,
    enumName: 'NotificationStatus',
    description: 'Filter by notification status',
  })
  @IsEnum(NotificationStatus)
  @IsOptional()
  status?: NotificationStatus = NotificationStatus.PENDING;
}

export class NotificationResponseDto {
  @ApiProperty({ example: 'uuid-string' })
  id: string;

  @ApiProperty({ example: 'NEW_MANGA' })
  type: string;

  @ApiProperty({ example: 'New Manga Added: One Piece' })
  title: string;

  @ApiProperty({
    example: 'A new manga "One Piece" has been added to the library!',
  })
  message: string;

  @ApiProperty({
    example: {
      mangaId: 'uuid-string',
      title: 'One Piece',
      coverUrl: 'https://example.com/cover.jpg',
    },
  })
  data: any;

  @ApiProperty({
    type: [String],
    example: ['IN_APP', 'EMAIL'],
  })
  channels: string[];

  @ApiProperty({
    enum: NotificationStatus,
    example: NotificationStatus.PENDING,
  })
  status: NotificationStatus;

  @ApiProperty({
    enum: NotificationPriority,
    example: NotificationPriority.MEDIUM,
  })
  priority: NotificationPriority;

  @ApiProperty({
    example: '2024-01-20T12:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    nullable: true,
    example: '2024-01-20T12:05:00Z',
  })
  readAt?: Date;
}

export class PaginatedNotificationsResponseDto {
  @ApiProperty({
    type: [NotificationResponseDto],
    description: 'Array of notifications',
  })
  data: NotificationResponseDto[];

  @ApiProperty({
    example: {
      total: 100,
      page: 1,
      limit: 10,
      totalPages: 10,
    },
  })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
