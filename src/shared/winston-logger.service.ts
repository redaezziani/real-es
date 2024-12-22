import { Injectable } from '@nestjs/common';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

@Injectable()
export class WinstonLoggerService {
  private readonly logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: 'info', // Default log level
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message, context, ip }) => {
          return `[${timestamp}] [${level.toUpperCase()}] [${context || 'App'}] [${ip || 'N/A'}]: ${message}`;
        }),
      ),
      transports: [
        // Write logs to a file with rotation
        new winston.transports.DailyRotateFile({
          dirname: 'logs', // Directory where logs are stored
          filename: 'app-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
        }),
        // Log to the console
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
          ),
        }),
      ],
    });
  }

  log(message: string, context?: string, ip?: string) {
    this.logger.info(message, { context, ip });
  }

  error(message: string, trace?: string, context?: string, ip?: string) {
    this.logger.error(`${message} - ${trace || ''}`, { context, ip });
  }

  warn(message: string, context?: string, ip?: string) {
    this.logger.warn(message, { context, ip });
  }

  actionRequired(message: string, context?: string, ip?: string) {
    this.logger.warn(`[ACTION REQUIRED] ${message}`, { context, ip });
  }

  debug(message: string, context?: string, ip?: string) {
    this.logger.debug(message, { context, ip });
  }

  verbose(message: string, context?: string, ip?: string) {
    this.logger.verbose(message, { context, ip });
  }
}
