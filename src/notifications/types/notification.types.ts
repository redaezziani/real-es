// src/notifications/types/notification.types.ts
export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'PUSH';

export interface NotificationTemplate<T = any> {
  type: string;
  title: (data: T) => string;
  message: (data: T) => string;
  channels: NotificationChannel[];
}

export interface BaseNotificationPayload {
  id: string;
  createdAt: Date;
  recipientId?: string;
}

export interface NotificationData<T = any> extends BaseNotificationPayload {
  type: string;
  title: string;
  message: string;
  data: T;
  channels: NotificationChannel[];
  status: NotificationStatus;
  priority: NotificationPriority;
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  READ = 'READ',
}

export enum NotificationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}
