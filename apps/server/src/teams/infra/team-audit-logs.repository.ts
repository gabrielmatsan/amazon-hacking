import { eq, desc } from "drizzle-orm";

import { db } from "@/shared/infra/databases/postgres";
import { teamAuditLogsSchema, type NewTeamAuditLog } from "../domain/teams.schema";
import type { TeamAuditLog } from "../domain/teams.type";

export const TeamAuditLogsRepository = {
  async create(data: NewTeamAuditLog): Promise<TeamAuditLog> {
    const [log] = await db
      .insert(teamAuditLogsSchema)
      .values(data)
      .returning();

    return log;
  },

  async findByTeamId(teamId: string): Promise<TeamAuditLog[]> {
    return db
      .select()
      .from(teamAuditLogsSchema)
      .where(eq(teamAuditLogsSchema.teamId, teamId))
      .orderBy(desc(teamAuditLogsSchema.createdAt));
  },
};
