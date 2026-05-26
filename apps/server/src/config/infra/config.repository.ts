import { eq } from "drizzle-orm";
import { db } from "@/shared/infra/databases/postgres";
import { appConfigSchema, type AppConfig } from "../domain/config.schema";

export const ConfigRepository = {
  async get(): Promise<AppConfig | null> {
    const [config] = await db.select().from(appConfigSchema).limit(1);
    return config ?? null;
  },

  async upsert(data: {
    votingStartsAt: Date | null;
    votingEndsAt: Date | null;
    votingEnabled: boolean;
  }): Promise<AppConfig> {
    const existing = await this.get();

    if (existing) {
      const [updated] = await db
        .update(appConfigSchema)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(appConfigSchema.id, existing.id))
        .returning();
      return updated;
    }

    const [created] = await db
      .insert(appConfigSchema)
      .values(data)
      .returning();
    return created;
  },

  async isVotingOpen(): Promise<{ open: boolean; reason?: string }> {
    const config = await this.get();
    if (!config) return { open: true };

    if (!config.votingEnabled) {
      return { open: false, reason: "Votação desabilitada" };
    }

    const now = new Date();

    if (config.votingStartsAt && now < config.votingStartsAt) {
      return { open: false, reason: "Votação ainda não começou" };
    }

    if (config.votingEndsAt && now > config.votingEndsAt) {
      return { open: false, reason: "Votação encerrada" };
    }

    return { open: true };
  },
};
