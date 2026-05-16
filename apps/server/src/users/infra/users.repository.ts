import { db } from "@/shared/infra/databases/postgres";
import { eq } from "drizzle-orm";
import { usersSchema, type NewUser } from "../domain/users.schema";
import { User } from "../domain/users.type";

export const UsersRepository = {
  async findByEmail(email: string): Promise<User | null> {
    const [user] = await db.select().from(usersSchema).where(eq(usersSchema.email, email));
    return user;
  },

  async create(data: NewUser): Promise<User> {
    const [user] = await db.insert(usersSchema).values(data).returning();
    return user;
  },
}