import { NotFoundError } from "@/shared/infra/errors/not-found-error";
import { ItemsRepository } from "../infra/items.repository";

export async function deleteItem(id: string) {
  const deleted = await ItemsRepository.delete(id);
  if (!deleted) throw new NotFoundError("Item not found");
}
