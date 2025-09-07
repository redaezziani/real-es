import { IsString, IsOptional, IsEnum, IsObject, IsDateString } from 'class-validator';

export class NotificationDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsEnum(['info', 'success', 'warning', 'error'])
  type: 'info' | 'success' | 'warning' | 'error';

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsObject()
  data?: any;

  @IsOptional()
  @IsDateString()
  timestamp?: Date;

  @IsOptional()
  @IsString()
  userId?: string;
}

export class JoinRoomDto {
  @IsString()
  roomName: string;

  @IsOptional()
  @IsString()
  userId?: string;
}

export class LeaveRoomDto {
  @IsString()
  roomName: string;
}
