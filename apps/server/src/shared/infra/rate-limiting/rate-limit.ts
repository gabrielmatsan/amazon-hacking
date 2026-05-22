import type { Context, Options } from 'elysia-rate-limit';
import { randomUUID } from 'node:crypto';
import { redis } from '../databases/redis';

export class RateLimitContext implements Context {

  private readonly PREFIX_KEY = 'rt';
  private durationMs: number | undefined = 1000 * 60 * 1;

  init(options: Omit<Options, 'context'>): void {
    this.durationMs = typeof options.duration === 'function' ? undefined : options.duration;
  }

  async increment(
    key: string,
    duration?: number,
    requestTime?: number,
  ): Promise<{ count: number; nextReset: Date; start: number }> {
    const effectiveDuration = duration ?? this.durationMs;
    if (effectiveDuration === undefined) {
      throw new Error('RateLimitContext.increment: duration is required when options.duration is a function but no per-call duration was provided');
    }

    const redisKey = `${this.PREFIX_KEY}:${key}`;
    const now = requestTime ?? Date.now();
    const windowStart = now - effectiveDuration;
    const ttlSeconds = Math.ceil(effectiveDuration / 1000);
    const member = `${now}:${randomUUID()}`;

    const results = await redis
      .pipeline()
      .zremrangebyscore(redisKey, 0, windowStart)
      .zadd(redisKey, now, member)
      .zcard(redisKey)
      .expire(redisKey, ttlSeconds)
      .zrange(redisKey, 0, 0, 'WITHSCORES')
      .exec();

    if (!results) {
      throw new Error('Redis pipeline returned no results');
    }

    for (const [err] of results) {
      if (err) throw err;
    }

    const count = results[2][1] as number;
    const oldest = results[4][1] as string[];
    const oldestTimestamp = oldest.length >= 2 ? Number(oldest[1]) : now;
    const nextReset = new Date(oldestTimestamp + effectiveDuration);

    return { count, nextReset, start: oldestTimestamp };
  }

  async decrement(key: string): Promise<void> {
    const redisKey = `${this.PREFIX_KEY}:${key}`;
    await redis.zpopmax(redisKey);
  }

  async reset(key?: string): Promise<void> {
    if (key) {
      await redis.del(`${this.PREFIX_KEY}:${key}`);
      return;
    }

    await new Promise<void>((resolve, reject) => {
      const stream = redis.scanStream({ match: `${this.PREFIX_KEY}:*`, count: 100 });
      const pipeline = redis.pipeline();
      let pending = 0;

      stream.on('data', (keys: string[]) => {
        for (const k of keys) {
          pipeline.del(k);
          pending++;
        }
      });
      stream.on('end', () => {
        if (pending === 0) return resolve();
        pipeline.exec().then(() => resolve()).catch(reject);
      });
      stream.on('error', reject);
    });
  }

  async kill(): Promise<void> {
    // Redis connection is shared and managed by app lifecycle
  }
}
