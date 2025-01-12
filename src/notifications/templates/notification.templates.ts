// src/notifications/templates/notification.templates.ts
import { NotificationTemplate } from '../types/notification.types';

interface MangaNotificationData {
  mangaId: string;
  title: string;
  slug: string;
  coverUrl: string;
}

interface ChapterNotificationData {
  mangaId: string;
  mangaTitle: string;
  chapterId: string;
  chapterNumber: number;
}

export const NotificationTemplates: Record<
  string,
  NotificationTemplate<any>
> = {
  NEW_MANGA: {
    type: 'NEW_MANGA',
    title: (data: MangaNotificationData) => `مانجا جديدة: ${data.title}`,
    message: (data: MangaNotificationData) =>
      `تمت إضافة مانجا جديدة "${data.title}" إلى المكتبة!`,
    channels: ['IN_APP', 'EMAIL'],
  },
  NEW_CHAPTER: {
    type: 'NEW_CHAPTER',
    title: (data: ChapterNotificationData) =>
      `فصل جديد: ${data.mangaTitle} #${data.chapterNumber}`,
    message: (data: ChapterNotificationData) =>
      `الفصل ${data.chapterNumber} من ${data.mangaTitle} متاح الآن!`,
    channels: ['IN_APP', 'PUSH'],
  },
  MANGA_UPDATE: {
    type: 'MANGA_UPDATE',
    title: (data: MangaNotificationData) => `تحديث المانجا: ${data.title}`,
    message: (data: MangaNotificationData) =>
      `تم تحديث معلومات المانجا "${data.title}"!`,
    channels: ['IN_APP'],
  },
  SYSTEM: {
    type: 'SYSTEM',
    title: () => `إشعار النظام`,
    message: (data: { message: string }) => data.message,
    channels: ['IN_APP'],
  },
};
