import { NotFoundError } from "@/shared/infra/errors/not-found-error";
import type { NewItem } from "../domain/items.schema";
import { ItemsRepository } from "../infra/items.repository";

export async function updateItem(id: string, data: Partial<NewItem>) {
  const item = await ItemsRepository.update(id, data);
  if (!item) throw new NotFoundError("Item not found");
  return item;
}
