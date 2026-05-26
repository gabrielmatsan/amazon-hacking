import { ConfigRepository } from "../infra/config.repository";

export async function updateConfigUseCase(data: {
  votingStartsAt: string | null;
  votingEndsAt: string | null;
  votingEnabled: boolean;
  maxRiskScore: number;
}) {
  return ConfigRepository.upsert({
    votingStartsAt: data.votingStartsAt ? new Date(data.votingStartsAt) : null,
    votingEndsAt: data.votingEndsAt ? new Date(data.votingEndsAt) : null,
    votingEnabled: data.votingEnabled,
    maxRiskScore: data.maxRiskScore,
  });
}
