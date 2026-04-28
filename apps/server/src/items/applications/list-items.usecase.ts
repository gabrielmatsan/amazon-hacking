import { ItemsRepository } from "../infra/items.repository";

export async function listItems() {
  return ItemsRepository.findAll();
}
