import { Injectable, OnModuleInit } from '@nestjs/common';
import { Redis } from '@upstash/redis';
import { secrets } from 'src/config/secrets';

@Injectable()
export class RedisService implements OnModuleInit {
  private redisClient: Redis;

  async onModuleInit() {
    this.redisClient = new Redis({
      url: secrets.redis.url,
      token: secrets.redis.token,
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
    console.warn('clearAll not implemented for Upstash Redis');
  }
}
