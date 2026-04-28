import { eq } from "drizzle-orm";
import { db } from "@/shared/infra/databases/postgres";
import { items, type Item, type NewItem } from "../domain/items.schema";

export const ItemsRepository = {
  async findAll(): Promise<Item[]> {
    return db.select().from(items).orderBy(items.createdAt);
  },

  async findById(id: string): Promise<Item | undefined> {
    const [item] = await db.select().from(items).where(eq(items.id, id));
    return item;
  },

  async create(data: NewItem): Promise<Item> {
    const [item] = await db.insert(items).values(data).returning();
    return item;
  },

  async update(id: string, data: Partial<NewItem>): Promise<Item | undefined> {
    const [item] = await db
      .update(items)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(items.id, id))
      .returning();
    return item;
  },

  async delete(id: string): Promise<boolean> {
    const result = await db.delete(items).where(eq(items.id, id)).returning();
    return result.length > 0;
  },
};
