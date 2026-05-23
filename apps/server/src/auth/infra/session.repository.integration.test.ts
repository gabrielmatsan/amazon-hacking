import { afterAll, beforeEach, describe, expect, it } from "bun:test";
import { createHash } from "crypto";

import { redis } from "@/shared/infra/databases/redis";

import { SessionRepository, type SessionRecord } from "./session.repository";

const TTL_SECONDS = 7 * 24 * 60 * 60;
const TOUCH_THRESHOLD_SECONDS = 6 * 24 * 60 * 60;

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

function makeUser(overrides: Partial<{ id: string; email: string; role: string }> = {}) {
  return {
    id: overrides.id ?? `user-${Math.random().toString(36).slice(2, 10)}`,
    email: overrides.email ?? `${Math.random().toString(36).slice(2, 10)}@example.com`,
    role: overrides.role ?? "user",
  };
}

async function flushSessionKeys() {
  const patterns = ["session:*", "user_sessions:*"];
  for (const pattern of patterns) {
    const stream = redis.scanStream({ match: pattern, count: 200 });
    const keys: string[] = [];
    for await (const batch of stream) {
      keys.push(...(batch as string[]));
    }
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}

describe("SessionRepository (integration, security focus)", () => {
  beforeEach(async () => {
    await flushSessionKeys();
  });

  afterAll(async () => {
    await flushSessionKeys();
  });

  describe("create()", () => {
    it("returns a base64url sid with at least 256 bits of entropy (~43 chars)", async () => {
      const sid = await SessionRepository.create(makeUser());

      expect(sid).toBeString();
      expect(sid).toMatch(/^[A-Za-z0-9_-]+$/);
      // 256 bits = 32 bytes; base64url(32 bytes) = 43 chars (no padding)
      expect(sid.length).toBeGreaterThanOrEqual(43);
    });

    it("generates unique sids across many invocations (no collisions in 1000 creates)", async () => {
      const user = makeUser();
      const sids = await Promise.all(
        Array.from({ length: 1000 }, () => SessionRepository.create(user)),
      );

      expect(new Set(sids).size).toBe(sids.length);
    });

    it("stores the session hashed — raw sid is NOT recoverable as a Redis key", async () => {
      const sid = await SessionRepository.create(makeUser());

      const rawKey = await redis.get(`session:${sid}`);
      expect(rawKey).toBeNull();

      const hashedKey = await redis.get(`session:${sha256(sid)}`);
      expect(hashedKey).toBeString();
    });

    it("persists user metadata (ip, userAgent) but never the raw sid", async () => {
      const user = makeUser();
      const sid = await SessionRepository.create(user, {
        ip: "203.0.113.42",
        ua: "TestAgent/1.0",
      });

      const raw = await redis.get(`session:${sha256(sid)}`);
      const record = JSON.parse(raw!) as SessionRecord;

      expect(record.userId).toBe(user.id);
      expect(record.email).toBe(user.email);
      expect(record.ipAddress).toBe("203.0.113.42");
      expect(record.userAgent).toBe("TestAgent/1.0");
      // The raw sid must NEVER appear in the stored payload
      expect(JSON.stringify(record)).not.toContain(sid);
    });

    it("applies TTL of 7 days to the session key", async () => {
      const sid = await SessionRepository.create(makeUser());
      const ttl = await redis.ttl(`session:${sha256(sid)}`);

      // Allow small drift; should be very close to TTL_SECONDS
      expect(ttl).toBeGreaterThan(TTL_SECONDS - 5);
      expect(ttl).toBeLessThanOrEqual(TTL_SECONDS);
    });

    it("indexes the session under user_sessions:{userId} with expiry score", async () => {
      const user = makeUser();
      const beforeMs = Date.now();
      const sid = await SessionRepository.create(user);
      const afterMs = Date.now();

      const entries = await redis.zrange(
        `user_sessions:${user.id}`,
        0,
        -1,
        "WITHSCORES",
      );

      expect(entries).toHaveLength(2);
      expect(entries[0]).toBe(sha256(sid));

      const score = Number(entries[1]);
      expect(score).toBeGreaterThanOrEqual(beforeMs + TTL_SECONDS * 1000);
      expect(score).toBeLessThanOrEqual(afterMs + TTL_SECONDS * 1000 + 10);
    });

    it("supports multiple concurrent sessions per user (multi-device)", async () => {
      const user = makeUser();
      const [s1, s2, s3] = await Promise.all([
        SessionRepository.create(user),
        SessionRepository.create(user),
        SessionRepository.create(user),
      ]);

      const indexed = await redis.zrange(`user_sessions:${user.id}`, 0, -1);
      expect(new Set(indexed)).toEqual(
        new Set([sha256(s1), sha256(s2), sha256(s3)]),
      );
    });
  });

  describe("get()", () => {
    it("returns the record for a valid sid", async () => {
      const user = makeUser({ role: "admin" });
      const sid = await SessionRepository.create(user);

      const record = await SessionRepository.get(sid);

      expect(record).not.toBeNull();
      expect(record!.userId).toBe(user.id);
      expect(record!.email).toBe(user.email);
      expect(record!.role).toBe("admin");
    });

    it("returns null for a sid that was never issued", async () => {
      const record = await SessionRepository.get("totally-fake-sid-xyz");
      expect(record).toBeNull();
    });

    it("returns null for a sid that exists in Redis under its RAW form (no double-lookup)", async () => {
      // Attacker plants a Redis key under the raw sid value — get() must not accept it
      const evilSid = "attacker-controlled-sid";
      const fakeRecord: SessionRecord = {
        userId: "evil",
        email: "evil@example.com",
        role: "admin",
        createdAt: Date.now(),
        lastSeenAt: Date.now(),
      };
      await redis.set(`session:${evilSid}`, JSON.stringify(fakeRecord), "EX", 60);

      const record = await SessionRepository.get(evilSid);
      expect(record).toBeNull();
    });

    it("returns null after the session key has been deleted (revoked)", async () => {
      const sid = await SessionRepository.create(makeUser());
      await redis.del(`session:${sha256(sid)}`);

      expect(await SessionRepository.get(sid)).toBeNull();
    });

    it("returns null when the stored JSON is corrupted", async () => {
      const sid = await SessionRepository.create(makeUser());
      await redis.set(`session:${sha256(sid)}`, "not-valid-json{", "EX", 60);

      expect(await SessionRepository.get(sid)).toBeNull();
    });

    it("does not throw on empty string sid", async () => {
      expect(await SessionRepository.get("")).toBeNull();
    });
  });

  describe("touch()", () => {
    it("does NOT renew TTL when current TTL is still above the 6-day threshold", async () => {
      const sid = await SessionRepository.create(makeUser());
      const key = `session:${sha256(sid)}`;

      // Force TTL to exactly the threshold (so touch should remain a no-op)
      await redis.expire(key, TOUCH_THRESHOLD_SECONDS);
      await SessionRepository.touch(sid);

      const ttl = await redis.ttl(key);
      expect(ttl).toBeLessThanOrEqual(TOUCH_THRESHOLD_SECONDS);
      expect(ttl).toBeGreaterThan(TOUCH_THRESHOLD_SECONDS - 5);
    });

    it("renews TTL back to 7 days when current TTL drops below the threshold", async () => {
      const sid = await SessionRepository.create(makeUser());
      const key = `session:${sha256(sid)}`;

      await redis.expire(key, TOUCH_THRESHOLD_SECONDS - 100);
      await SessionRepository.touch(sid);

      const ttl = await redis.ttl(key);
      expect(ttl).toBeGreaterThan(TTL_SECONDS - 5);
      expect(ttl).toBeLessThanOrEqual(TTL_SECONDS);
    });

    it("updates lastSeenAt when it renews", async () => {
      const sid = await SessionRepository.create(makeUser());
      const key = `session:${sha256(sid)}`;

      const before = (JSON.parse((await redis.get(key))!) as SessionRecord).lastSeenAt;
      await redis.expire(key, TOUCH_THRESHOLD_SECONDS - 100);
      await new Promise((r) => setTimeout(r, 5));
      await SessionRepository.touch(sid);

      const after = (JSON.parse((await redis.get(key))!) as SessionRecord).lastSeenAt;
      expect(after).toBeGreaterThan(before);
    });

    it("is a no-op for a sid that does not exist (no error, no key created)", async () => {
      await SessionRepository.touch("nonexistent-sid");
      const ttl = await redis.ttl("session:" + sha256("nonexistent-sid"));
      expect(ttl).toBe(-2); // key does not exist
    });

    it("does NOT recreate an expired session", async () => {
      const sid = await SessionRepository.create(makeUser());
      const key = `session:${sha256(sid)}`;
      await redis.del(key);

      await SessionRepository.touch(sid);

      expect(await redis.get(key)).toBeNull();
    });
  });

  describe("destroy()", () => {
    it("removes the session key", async () => {
      const sid = await SessionRepository.create(makeUser());
      await SessionRepository.destroy(sid);

      expect(await SessionRepository.get(sid)).toBeNull();
      expect(await redis.get(`session:${sha256(sid)}`)).toBeNull();
    });

    it("removes the sid from the user index ZSET", async () => {
      const user = makeUser();
      const sid = await SessionRepository.create(user);

      await SessionRepository.destroy(sid);

      const entries = await redis.zrange(`user_sessions:${user.id}`, 0, -1);
      expect(entries).not.toContain(sha256(sid));
    });

    it("leaves OTHER sessions of the same user untouched", async () => {
      const user = makeUser();
      const keepSid = await SessionRepository.create(user);
      const dropSid = await SessionRepository.create(user);

      await SessionRepository.destroy(dropSid);

      expect(await SessionRepository.get(keepSid)).not.toBeNull();
      expect(await SessionRepository.get(dropSid)).toBeNull();
    });

    it("is idempotent — destroying twice is safe", async () => {
      const sid = await SessionRepository.create(makeUser());
      await SessionRepository.destroy(sid);
      await SessionRepository.destroy(sid);

      expect(await SessionRepository.get(sid)).toBeNull();
    });

    it("does not throw when called with a sid that was never issued", async () => {
      await SessionRepository.destroy("never-issued-sid");
      // no assertion on the data — only on the absence of throw
    });
  });

  describe("destroyAll()", () => {
    it("returns 0 for a user with no active sessions", async () => {
      const revoked = await SessionRepository.destroyAll("ghost-user");
      expect(revoked).toBe(0);
    });

    it("revokes every active session and returns the count", async () => {
      const user = makeUser();
      const sids = await Promise.all([
        SessionRepository.create(user),
        SessionRepository.create(user),
        SessionRepository.create(user),
      ]);

      const revoked = await SessionRepository.destroyAll(user.id);

      expect(revoked).toBe(3);
      for (const sid of sids) {
        expect(await SessionRepository.get(sid)).toBeNull();
      }
    });

    it("clears the user index after revoking", async () => {
      const user = makeUser();
      await SessionRepository.create(user);
      await SessionRepository.create(user);

      await SessionRepository.destroyAll(user.id);

      const exists = await redis.exists(`user_sessions:${user.id}`);
      expect(exists).toBe(0);
    });

    it("does NOT touch sessions of other users (tenant isolation)", async () => {
      const userA = makeUser({ id: "user-a" });
      const userB = makeUser({ id: "user-b" });

      const aSid = await SessionRepository.create(userA);
      const bSid = await SessionRepository.create(userB);

      await SessionRepository.destroyAll(userA.id);

      expect(await SessionRepository.get(aSid)).toBeNull();
      expect(await SessionRepository.get(bSid)).not.toBeNull();
    });

    it("revokes 100 concurrent sessions of one user without losing any", async () => {
      const user = makeUser();
      const sids = await Promise.all(
        Array.from({ length: 100 }, () =>
          SessionRepository.create({
            id: user.id,
            email: user.email,
            role: user.role,
          }),
        ),
      );

      // sanity: index holds all 100 before we revoke
      const indexed = await redis.zrange(`user_sessions:${user.id}`, 0, -1);
      expect(indexed).toHaveLength(100);

      const revoked = await SessionRepository.destroyAll(user.id);
      expect(revoked).toBe(100);

      const remaining = await Promise.all(sids.map((s) => SessionRepository.get(s)));
      expect(remaining.every((r) => r === null)).toBe(true);

      const exists = await redis.exists(`user_sessions:${user.id}`);
      expect(exists).toBe(0);
    });

    it("revokes a high-cardinality user without affecting a parallel high-cardinality user", async () => {
      const userA = makeUser({ id: "user-bulk-a" });
      const userB = makeUser({ id: "user-bulk-b" });

      const aSids = await Promise.all(
        Array.from({ length: 50 }, () =>
          SessionRepository.create({
            id: userA.id,
            email: userA.email,
            role: userA.role,
          }),
        ),
      );
      const bSids = await Promise.all(
        Array.from({ length: 50 }, () =>
          SessionRepository.create({
            id: userB.id,
            email: userB.email,
            role: userB.role,
          }),
        ),
      );

      const revoked = await SessionRepository.destroyAll(userA.id);
      expect(revoked).toBe(50);

      const aRemaining = await Promise.all(aSids.map((s) => SessionRepository.get(s)));
      expect(aRemaining.every((r) => r === null)).toBe(true);

      const bRemaining = await Promise.all(bSids.map((s) => SessionRepository.get(s)));
      expect(bRemaining.every((r) => r !== null)).toBe(true);

      const bIndexed = await redis.zrange(`user_sessions:${userB.id}`, 0, -1);
      expect(bIndexed).toHaveLength(50);
    });

    it("ignores expired index entries (ZREMRANGEBYSCORE on stale members)", async () => {
      const user = makeUser();
      const liveSid = await SessionRepository.create(user);

      // Inject a fake expired index entry pointing to a hash that no longer has a session key
      await redis.zadd(
        `user_sessions:${user.id}`,
        Date.now() - 1000,
        "stale-hash-with-no-session",
      );

      const revoked = await SessionRepository.destroyAll(user.id);

      // Only the live session should count; the expired stub is dropped before counting
      expect(revoked).toBe(1);
      expect(await SessionRepository.get(liveSid)).toBeNull();
    });
  });

  describe("cross-cutting security invariants", () => {
    it("two distinct sids never collide under the hashing function", async () => {
      const user = makeUser();
      const sids = await Promise.all(
        Array.from({ length: 200 }, () => SessionRepository.create(user)),
      );
      const hashes = sids.map(sha256);
      expect(new Set(hashes).size).toBe(hashes.length);
    });

    it("an attacker who guesses the hashed key cannot reverse it to the sid", async () => {
      // Sanity: SHA-256 is one-way; we verify the stored key is the hash and not the sid.
      const sid = await SessionRepository.create(makeUser());
      const expectedKey = `session:${sha256(sid)}`;
      const exists = await redis.exists(expectedKey);
      expect(exists).toBe(1);
      expect(expectedKey).not.toContain(sid);
    });

    it("sid format does not include cookie-breaking characters", async () => {
      for (let i = 0; i < 100; i++) {
        const sid = await SessionRepository.create(makeUser());
        // base64url: no '+', '/', '=', ';', whitespace, or control chars
        expect(sid).not.toMatch(/[;,\s=+/]/);
      }
    });
  });
});
