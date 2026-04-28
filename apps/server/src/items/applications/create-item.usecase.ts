import type { NewItem } from "../domain/items.schema";
import { ItemsRepository } from "../infra/items.repository";

export async function createItem(data: NewItem) {
  return ItemsRepository.create(data);
}
