import { createHash, randomBytes } from "crypto";

import type { AuthUser } from "@/shared/infra/auth.middleware";
import { redis } from "@/shared/infra/databases/redis";
import type { UserRole } from "@/users/domain/users.type";

const SESSION_PREFIX = "session:";
const USER_INDEX_PREFIX = "user_sessions:";
const TTL_SECONDS = 7 * 24 * 60 * 60;
const TOUCH_THRESHOLD_SECONDS = 6 * 24 * 60 * 60;

export interface SessionRecord {
  userId: string;
  email: string;
  role: UserRole;
  createdAt: number;
  lastSeenAt: number;
  ipAddress?: string;
  userAgent?: string;
}

function generateSid(): string {
  return randomBytes(32).toString("base64url");
}

function hashSid(sid: string): string {
  return createHash("sha256").update(sid).digest("hex");
}

function sessionKey(hashed: string): string {
  return `${SESSION_PREFIX}${hashed}`;
}

function userIndexKey(userId: string): string {
  return `${USER_INDEX_PREFIX}${userId}`;
}

export class SessionRepository {
  static async create(
    user: AuthUser,
    meta?: { ip?: string; ua?: string },
  ): Promise<string> {
    const sid = generateSid();
    const hashed = hashSid(sid);
    const now = Date.now();
    const expiryMs = now + TTL_SECONDS * 1000;

    const record: SessionRecord = {
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
      createdAt: now,
      lastSeenAt: now,
      ipAddress: meta?.ip,
      userAgent: meta?.ua,
    };

    await redis
      .pipeline()
      .set(sessionKey(hashed), JSON.stringify(record), "EX", TTL_SECONDS)
      .zadd(userIndexKey(user.id), expiryMs, hashed)
      .expire(userIndexKey(user.id), TTL_SECONDS)
      .exec();

    return sid;
  }

  static async get(sid: string): Promise<SessionRecord | null> {
    const raw = await redis.get(sessionKey(hashSid(sid)));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SessionRecord;
    } catch {
      return null;
    }
  }

  static async touch(sid: string): Promise<void> {
    const hashed = hashSid(sid);
    const key = sessionKey(hashed);

    const ttl = await redis.ttl(key);
    if (ttl < 0 || ttl >= TOUCH_THRESHOLD_SECONDS) return;

    const raw = await redis.get(key);
    if (!raw) return;

    let record: SessionRecord;
    try {
      record = JSON.parse(raw) as SessionRecord;
    } catch {
      return;
    }

    const now = Date.now();
    record.lastSeenAt = now;
    const expiryMs = now + TTL_SECONDS * 1000;

    await redis
      .pipeline()
      .set(key, JSON.stringify(record), "EX", TTL_SECONDS)
      .zadd(userIndexKey(record.userId), expiryMs, hashed)
      .expire(userIndexKey(record.userId), TTL_SECONDS)
      .exec();
  }

  static async destroy(sid: string): Promise<void> {
    const hashed = hashSid(sid);
    const key = sessionKey(hashed);

    const raw = await redis.get(key);
    let userId: string | null = null;
    if (raw) {
      try {
        userId = (JSON.parse(raw) as SessionRecord).userId;
      } catch {
        // fall through; still delete the session key
      }
    }

    const pipeline = redis.pipeline().del(key);
    if (userId) pipeline.zrem(userIndexKey(userId), hashed);
    await pipeline.exec();
  }

  static async destroyAll(userId: string): Promise<number> {
    const indexKey = userIndexKey(userId);

    await redis.zremrangebyscore(indexKey, 0, Date.now());
    const hashes = await redis.zrange(indexKey, 0, -1);

    if (hashes.length === 0) {
      await redis.del(indexKey);
      return 0;
    }

    await redis
      .pipeline()
      .del(...hashes.map(sessionKey))
      .del(indexKey)
      .exec();

    return hashes.length;
  }
}
