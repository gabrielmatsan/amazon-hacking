import { NotFoundError } from "@/shared/infra/errors/not-found-error";
import { ItemsRepository } from "../infra/items.repository";

export async function getItem(id: string) {
  const item = await ItemsRepository.findById(id);
  if (!item) throw new NotFoundError("Item not found");
  return item;
}
