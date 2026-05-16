import type { Context, Options } from 'elysia-rate-limit';
import { redis } from '../databases/redis';

export class RateLimitContext implements Context {

  private readonly PREFIX_KEY = '{rt}';
  private durationMs: number = 1000 * 60 * 1;

  init(options: Omit<Options, 'context'>): void {
    this.durationMs = options.duration;
  }

  async increment(key: string): Promise<{ count: number; nextReset: Date; }> {
    const redisKey = `${this.PREFIX_KEY}:${key}`;
    const now = Date.now();
    const windowStart = now - this.durationMs;
    const ttlSeconds = Math.ceil(this.durationMs / 1000);

    const member = `${now}:${Math.random().toString(36).slice(2, 8)}`;

    const results = await redis
      .pipeline()
      .zremrangebyscore(redisKey, 0, windowStart)
      .zadd(redisKey, now, member)
      .zcard(redisKey)
      .expire(redisKey, ttlSeconds)
      .exec();

    const count = results?.[2]?.[1] as number;

    const oldest = await redis.zrange(redisKey, 0, 0, 'WITHSCORES');
    const oldestTimestamp = oldest.length >= 2 ? Number(oldest[1]) : now;
    const nextReset = new Date(oldestTimestamp + this.durationMs);

    return { count, nextReset };
  }

  async decrement(key: string): Promise<void> {
    const redisKey = `${this.PREFIX_KEY}:${key}`;
    const latest = await redis.zrange(redisKey, -1, -1);
    if (latest.length > 0) {
      await redis.zrem(redisKey, latest[0]);
    }
  }

  async reset(key?: string): Promise<void> {
    if (key) {
      await redis.del(`${this.PREFIX_KEY}:${key}`);
      return;
    }

    const keys = await redis.keys(`${this.PREFIX_KEY}:*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }

  async kill(): Promise<void> {
    // Redis connection is shared and managed by app lifecycle
  }
}
