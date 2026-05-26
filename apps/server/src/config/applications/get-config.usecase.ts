import { ConfigRepository } from "../infra/config.repository";

export async function getConfigUseCase() {
  const config = await ConfigRepository.get();
  return config ?? {
    id: null,
    votingStartsAt: null,
    votingEndsAt: null,
    votingEnabled: true,
    maxRiskScore: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
