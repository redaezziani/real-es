import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private redisClient: Redis;

  async onModuleInit() {
    this.redisClient = new Redis({
      host: 'localhost', // Use the hostname of your Redis server
      port: 6379, // Default Redis port
    });

    this.redisClient.on('connect', () => {
      console.log('Connected to Redis');
    });

    this.redisClient.on('error', (err) => {
      console.error('Redis error:', err);
    });
  }

  async set(key: string, value: string): Promise<string> {
    return this.redisClient.set(key, value);
  }

  async get(key: string): Promise<string | null> {
    return this.redisClient.get(key);
  }

  async del(key: string): Promise<number> {
    return this.redisClient.del(key);
  }
  async expire(key: string, seconds: number): Promise<void> {
    await this.redisClient.expire(key, seconds);
  }

  async clearAll(): Promise<void> {
    await this.redisClient.flushall();
  }

  async onModuleDestroy() {
    await this.redisClient.quit();
  }
}
