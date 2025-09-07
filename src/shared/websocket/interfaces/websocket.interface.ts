export interface IWebSocketUser {
  sub: string; // User ID
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export interface INotificationPayload {
  id?: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  data?: any;
  timestamp?: Date;
  userId?: string;
}

export interface IWebSocketResponse {
  status: 'success' | 'error';
  message?: string;
  data?: any;
}

export interface IRoomOptions {
  roomName: string;
  userId?: string;
  broadcastToAll?: boolean;
}

export interface IMangaNotificationPayload {
  id: string;
  type: 'new_manga' | 'new_chapter';
  mangaId: string;
  mangaTitle: string;
  mangaSlug?: string;
  chapterNumber?: number;
  chapterTitle?: string;
  chapterId?: string;
  coverImage?: string;
  timestamp: Date;
  message: string;
}

export interface IMangaUpdateData {
  mangaId: string;
  mangaTitle: string;
  mangaSlug?: string;
  coverImage?: string;
  chapterNumber?: number;
  chapterTitle?: string;
  chapterId?: string;
  description?: string;
}
