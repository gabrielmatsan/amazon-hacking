import { db } from "@/shared/infra/databases/postgres";
import { eq, ilike, inArray, sql } from "drizzle-orm";
import { usersSchema, type NewUser } from "../domain/users.schema";
import type { User, UserRole } from "../domain/users.type";

export const UsersRepository = {
  async findByEmail(email: string): Promise<User | null> {
    const [user] = await db.select().from(usersSchema).where(eq(usersSchema.email, email));
    return user;
  },

  async findById(id: string): Promise<User | null> {
    const [user] = await db.select().from(usersSchema).where(eq(usersSchema.id, id));
    return user;
  },

  async create(data: NewUser): Promise<User> {
    const [user] = await db.insert(usersSchema).values(data).returning();
    return user;
  },

  async findByTeamId(teamId: string): Promise<User | null> {
    const [user] = await db
      .select()
      .from(usersSchema)
      .where(eq(usersSchema.teamId, teamId));
    return user ?? null;
  },

  async updateTeamId(userId: string, teamId: string): Promise<void> {
    await db.update(usersSchema).set({ teamId }).where(eq(usersSchema.id, userId));
  },

  async updateRole(userId: string, role: UserRole): Promise<void> {
    await db.update(usersSchema).set({ role }).where(eq(usersSchema.id, userId));
  },

  async findManyByEmail(email: string): Promise<User[]> {
    const users = await db
      .select()
      .from(usersSchema)
      .where(ilike(usersSchema.email, `%${email}%`));
    return users;
  },
}