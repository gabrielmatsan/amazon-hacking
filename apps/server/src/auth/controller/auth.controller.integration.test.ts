import { beforeAll, beforeEach, describe, expect, it } from "bun:test";
import { Elysia } from "elysia";

import { IntegrationTestHelper } from "@/shared/utils/test-helpers/integration-test-helper";

import { authController } from "./auth.controller";

describe("Auth controller (integration)", () => {
  const app = new Elysia({ normalize: "typebox" }).use(authController);

  beforeAll(async () => {
    await IntegrationTestHelper.setupTestDatabase();
  });

  beforeEach(async () => {
    await IntegrationTestHelper.resetDatabase();
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
});
