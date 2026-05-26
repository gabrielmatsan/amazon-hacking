import { beforeAll, beforeEach, describe, expect, it } from "bun:test";

import { db } from "@/shared/infra/databases/postgres";
import { IntegrationTestHelper } from "@/shared/utils/test-helpers/integration-test-helper";
import { appConfigSchema } from "../domain/config.schema";
import { ConfigRepository } from "./config.repository";

describe("ConfigRepository (integration)", () => {
  beforeAll(async () => {
    await IntegrationTestHelper.setupTestDatabase();
  });

  beforeEach(async () => {
    await IntegrationTestHelper.resetDatabase();
  });

  describe("get", () => {
    it("returns null when no config exists", async () => {
      const config = await ConfigRepository.get();
      expect(config).toBeNull();
    });

    it("returns existing config", async () => {
      await db.insert(appConfigSchema).values({
        votingEnabled: false,
        votingStartsAt: new Date("2026-06-01T08:00:00Z"),
        votingEndsAt: new Date("2026-06-01T18:00:00Z"),
      });

      const config = await ConfigRepository.get();
      expect(config).not.toBeNull();
      expect(config!.votingEnabled).toBe(false);
    });
  });

  describe("upsert", () => {
    it("creates config when none exists", async () => {
      const config = await ConfigRepository.upsert({
        votingStartsAt: new Date("2026-06-01T08:00:00Z"),
        votingEndsAt: new Date("2026-06-01T18:00:00Z"),
        votingEnabled: true,
        maxRiskScore: 100,
      });

      expect(config.id).toBeString();
      expect(config.votingEnabled).toBe(true);
    });

    it("updates existing config", async () => {
      await ConfigRepository.upsert({
        votingStartsAt: new Date("2026-06-01T08:00:00Z"),
        votingEndsAt: new Date("2026-06-01T18:00:00Z"),
        votingEnabled: true,
        maxRiskScore: 100,
      });

      const updated = await ConfigRepository.upsert({
        votingStartsAt: null,
        votingEndsAt: null,
        votingEnabled: false,
        maxRiskScore: 50,
      });

      expect(updated.votingEnabled).toBe(false);
      expect(updated.votingStartsAt).toBeNull();
      expect(updated.votingEndsAt).toBeNull();
    });
  });

  describe("isVotingOpen", () => {
    it("returns open when no config exists", async () => {
      const result = await ConfigRepository.isVotingOpen();
      expect(result.open).toBe(true);
    });

    it("returns closed when voting is disabled", async () => {
      await db.insert(appConfigSchema).values({ votingEnabled: false });

      const result = await ConfigRepository.isVotingOpen();
      expect(result.open).toBe(false);
      expect(result.reason).toBe("Votação desabilitada");
    });

    it("returns closed when before start time", async () => {
      const future = new Date(Date.now() + 60 * 60 * 1000);
      await db.insert(appConfigSchema).values({
        votingEnabled: true,
        votingStartsAt: future,
      });

      const result = await ConfigRepository.isVotingOpen();
      expect(result.open).toBe(false);
      expect(result.reason).toBe("Votação ainda não começou");
    });

    it("returns closed when after end time", async () => {
      const past = new Date(Date.now() - 60 * 60 * 1000);
      await db.insert(appConfigSchema).values({
        votingEnabled: true,
        votingEndsAt: past,
      });

      const result = await ConfigRepository.isVotingOpen();
      expect(result.open).toBe(false);
      expect(result.reason).toBe("Votação encerrada");
    });

    it("returns open when within the window", async () => {
      const past = new Date(Date.now() - 60 * 60 * 1000);
      const future = new Date(Date.now() + 60 * 60 * 1000);
      await db.insert(appConfigSchema).values({
        votingEnabled: true,
        votingStartsAt: past,
        votingEndsAt: future,
      });

      const result = await ConfigRepository.isVotingOpen();
      expect(result.open).toBe(true);
    });

    it("returns open when no time limits set and enabled", async () => {
      await db.insert(appConfigSchema).values({
        votingEnabled: true,
        votingStartsAt: null,
        votingEndsAt: null,
      });

      const result = await ConfigRepository.isVotingOpen();
      expect(result.open).toBe(true);
    });
  });
});
