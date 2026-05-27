import { NotFoundError } from "@/shared/infra/errors/not-found-error";
import type { User } from "../domain/users.type";
import { UsersRepository } from "../infra/users.repository";

export async function findUserByEmailUseCase(email: string): Promise<User[]> {
  const users = await UsersRepository.findManyByEmail(email);

  return users;
}
