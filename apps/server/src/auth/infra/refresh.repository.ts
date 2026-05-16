import { createHash } from "crypto";
import { redis } from "@/shared/infra/databases/redis";

const PREFIX = "refresh_token:";
const TTL = 60 * 60 * 24 * 7; // 7 days

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function key(userId: string, jti: string): string {
  return `${PREFIX}${userId}:${jti}`;
}

export class RefreshTokenRepository {
  static async set(userId: string, jti: string, token: string): Promise<void> {
    await redis.set(key(userId, jti), hashToken(token), "EX", TTL);
  }

  /**
   * Atomically consumes the token: verifies the hash and deletes the key in one operation.
   * Prevents race conditions where concurrent refresh requests both pass verify before either deletes.
   * Returns true only if the token existed and matched — the caller must immediately issue a new token.
   */
  static async consume(userId: string, jti: string, token: string): Promise<boolean> {
    const stored = await redis.getdel(key(userId, jti));
    if (!stored) return false;
    return stored === hashToken(token);
  }

  static async delete(userId: string, jti: string): Promise<void> {
    await redis.del(key(userId, jti));
  }
}