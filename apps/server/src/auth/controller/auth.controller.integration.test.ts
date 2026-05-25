import { afterAll, beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { createHash } from "crypto";
import { Elysia } from "elysia";

import { SessionRepository } from "@/auth/infra/session.repository";
import { db } from "@/shared/infra/databases/postgres";
import { redis } from "@/shared/infra/databases/redis";
import { IntegrationTestHelper } from "@/shared/utils/test-helpers/integration-test-helper";
import { usersSchema } from "@/users/domain/users.schema";
import type { UserRole } from "@/users/domain/users.type";

import { authController } from "./auth.controller";

const TTL_SECONDS = 7 * 24 * 60 * 60;
const TOUCH_THRESHOLD_SECONDS = 6 * 24 * 60 * 60;

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
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

async function seedUserWithSession(role: UserRole = "user") {
  const email = `${role}-${Date.now()}-${Math.random()}@example.com`;
  const [user] = await db
    .insert(usersSchema)
    .values({
      name: `${role} user`,
      email,
      normalizedEmail: email.toLowerCase(),
      role,
    })
    .returning();

  const sid = await SessionRepository.create({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  return { user, sid };
}

const cookieFor = (sid: string) => `session_id=${sid}`;

describe("Auth controller (integration)", () => {
  const app = new Elysia({ normalize: "typebox" }).use(authController);

  beforeAll(async () => {
    await IntegrationTestHelper.setupTestDatabase();
  });

  beforeEach(async () => {
    await IntegrationTestHelper.resetDatabase();
    await flushSessionKeys();
  });

  afterAll(async () => {
    await flushSessionKeys();
  });

  describe("GET /auth/google/callback", () => {
    it("returns 400 when state cookie is missing (no prior /login)", async () => {
      const response = await app.handle(
        new Request(
          "http://localhost/auth/google/callback?code=fake-code&state=any-state",
        ),
      );

      expect(response.status).toBe(400);
    });
  });

  describe("GET /auth/google/login", () => {
    it("redirects to Google with state and returnTo cookie set", async () => {
      const response = await app.handle(
        new Request("http://localhost/auth/google/login?returnTo=/teams"),
      );

      expect(response.status).toBe(302);

      const location = response.headers.get("location");
      expect(location).toBeString();
      expect(location!).toContain("https://accounts.google.com/o/oauth2/v2/auth");

      const locationUrl = new URL(location!);
      expect(locationUrl.searchParams.get("client_id")).toBe("test-google-client-id");
      expect(locationUrl.searchParams.get("response_type")).toBe("code");
      expect(locationUrl.searchParams.get("redirect_uri")).toBe(
        "http://localhost:8080/v1/auth/google/callback",
      );
      const scope = locationUrl.searchParams.get("scope") ?? "";
      expect(scope).toContain("openid");
      expect(scope).toContain("email");
      expect(scope).toContain("profile");

      const stateInUrl = locationUrl.searchParams.get("state");
      expect(stateInUrl).toBeString();

      const setCookie = response.headers.get("set-cookie") ?? "";
      expect(setCookie).toContain("oauth_return_to=");
      expect(setCookie).toContain("HttpOnly");
    });
  });

  describe("GET /auth/me", () => {
    it("returns 401 when no session_id cookie is present", async () => {
      const response = await app.handle(
        new Request("http://localhost/auth/me"),
      );
      expect(response.status).toBe(401);
    });

    it("returns 401 when session_id points to a non-existent session", async () => {
      const response = await app.handle(
        new Request("http://localhost/auth/me", {
          headers: { cookie: cookieFor("bogus-session-id") },
        }),
      );
      expect(response.status).toBe(401);
    });

    it("returns 401 when the session has been revoked from Redis", async () => {
      const { sid } = await seedUserWithSession();
      await redis.del(`session:${sha256(sid)}`);

      const response = await app.handle(
        new Request("http://localhost/auth/me", {
          headers: { cookie: cookieFor(sid) },
        }),
      );
      expect(response.status).toBe(401);
    });

    it("returns 200 with the user profile for a valid session", async () => {
      const { user, sid } = await seedUserWithSession("admin");

      const response = await app.handle(
        new Request("http://localhost/auth/me", {
          headers: { cookie: cookieFor(sid) },
        }),
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({
        id: user.id,
        name: user.name,
        email: user.email,
        role: "admin",
      });
    });

    it("does NOT renew TTL on every request when TTL is above the throttle threshold", async () => {
      const { sid } = await seedUserWithSession();
      const key = `session:${sha256(sid)}`;

      // Force TTL slightly below the freshly-created 7d so that renewing would push it back up
      await redis.expire(key, TOUCH_THRESHOLD_SECONDS + 100);

      await app.handle(
        new Request("http://localhost/auth/me", {
          headers: { cookie: cookieFor(sid) },
        }),
      );
      // Wait for the fire-and-forget touch to settle
      await new Promise((r) => setTimeout(r, 30));

      const ttl = await redis.ttl(key);
      expect(ttl).toBeLessThanOrEqual(TOUCH_THRESHOLD_SECONDS + 100);
    });

    it("RENEWS TTL when current TTL has dropped below the threshold", async () => {
      const { sid } = await seedUserWithSession();
      const key = `session:${sha256(sid)}`;

      await redis.expire(key, TOUCH_THRESHOLD_SECONDS - 100);

      await app.handle(
        new Request("http://localhost/auth/me", {
          headers: { cookie: cookieFor(sid) },
        }),
      );
      await new Promise((r) => setTimeout(r, 30));

      const ttl = await redis.ttl(key);
      expect(ttl).toBeGreaterThan(TTL_SECONDS - 5);
    });

    it("rejects requests using a sid that exists only under the RAW key in Redis", async () => {
      // Defense-in-depth: middleware must lookup the hashed key only.
      const evilSid = "attacker-planted-sid";
      await redis.set(
        `session:${evilSid}`,
        JSON.stringify({
          userId: "evil",
          email: "evil@example.com",
          role: "admin",
          createdAt: Date.now(),
          lastSeenAt: Date.now(),
        }),
        "EX",
        60,
      );

      const response = await app.handle(
        new Request("http://localhost/auth/me", {
          headers: { cookie: cookieFor(evilSid) },
        }),
      );

      expect(response.status).toBe(401);
    });
  });

  describe("POST /auth/logout", () => {
    it("returns 200 and revokes the session for a valid sid", async () => {
      const { sid } = await seedUserWithSession();

      const response = await app.handle(
        new Request("http://localhost/auth/logout", {
          method: "POST",
          headers: { cookie: cookieFor(sid) },
        }),
      );

      expect(response.status).toBe(200);
      expect(await SessionRepository.get(sid)).toBeNull();
    });

    it("clears the session_id cookie via Set-Cookie", async () => {
      const { sid } = await seedUserWithSession();

      const response = await app.handle(
        new Request("http://localhost/auth/logout", {
          method: "POST",
          headers: { cookie: cookieFor(sid) },
        }),
      );

      const setCookie = response.headers.get("set-cookie") ?? "";
      expect(setCookie).toContain("session_id=");
      // Cookie must be cleared (Max-Age=0 or expired Expires)
      expect(setCookie).toMatch(/Max-Age=0|Expires=/i);
    });

    it("is idempotent — calling logout without any cookie returns 200", async () => {
      const response = await app.handle(
        new Request("http://localhost/auth/logout", { method: "POST" }),
      );
      expect(response.status).toBe(200);
    });

    it("does NOT affect other sessions of the same user", async () => {
      const { user, sid: keepSid } = await seedUserWithSession();
      const dropSid = await SessionRepository.create({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      const response = await app.handle(
        new Request("http://localhost/auth/logout", {
          method: "POST",
          headers: { cookie: cookieFor(dropSid) },
        }),
      );

      expect(response.status).toBe(200);
      expect(await SessionRepository.get(keepSid)).not.toBeNull();
      expect(await SessionRepository.get(dropSid)).toBeNull();
    });
  });

  describe("POST /auth/logout-all", () => {
    it("returns 401 when no session is present", async () => {
      const response = await app.handle(
        new Request("http://localhost/auth/logout-all", { method: "POST" }),
      );
      expect(response.status).toBe(401);
    });

    it("returns 401 when session_id is invalid", async () => {
      const response = await app.handle(
        new Request("http://localhost/auth/logout-all", {
          method: "POST",
          headers: { cookie: cookieFor("bogus") },
        }),
      );
      expect(response.status).toBe(401);
    });

    it("revokes every active session for the user and returns the count", async () => {
      const { user, sid } = await seedUserWithSession();
      const otherSids = await Promise.all([
        SessionRepository.create({ id: user.id, email: user.email, role: user.role }),
        SessionRepository.create({ id: user.id, email: user.email, role: user.role }),
      ]);

      const response = await app.handle(
        new Request("http://localhost/auth/logout-all", {
          method: "POST",
          headers: { cookie: cookieFor(sid) },
        }),
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.revoked).toBe(3);

      for (const s of [sid, ...otherSids]) {
        expect(await SessionRepository.get(s)).toBeNull();
      }
    });

    it("after logout-all, a follow-up /auth/me returns 401 (no zombie session)", async () => {
      const { sid } = await seedUserWithSession();
      await app.handle(
        new Request("http://localhost/auth/logout-all", {
          method: "POST",
          headers: { cookie: cookieFor(sid) },
        }),
      );

      const meResponse = await app.handle(
        new Request("http://localhost/auth/me", {
          headers: { cookie: cookieFor(sid) },
        }),
      );
      expect(meResponse.status).toBe(401);
    });

    it("does NOT revoke sessions belonging to a different user", async () => {
      const a = await seedUserWithSession();
      const b = await seedUserWithSession();

      const response = await app.handle(
        new Request("http://localhost/auth/logout-all", {
          method: "POST",
          headers: { cookie: cookieFor(a.sid) },
        }),
      );

      expect(response.status).toBe(200);
      expect(await SessionRepository.get(a.sid)).toBeNull();
      expect(await SessionRepository.get(b.sid)).not.toBeNull();
    });

    it("clears the calling session_id cookie via Set-Cookie", async () => {
      const { sid } = await seedUserWithSession();

      const response = await app.handle(
        new Request("http://localhost/auth/logout-all", {
          method: "POST",
          headers: { cookie: cookieFor(sid) },
        }),
      );

      const setCookie = response.headers.get("set-cookie") ?? "";
      expect(setCookie).toContain("session_id=");
      expect(setCookie).toMatch(/Max-Age=0|Expires=/i);
    });
  });
});
