import { logger } from "@/shared/infra/observability";
import { ConfigRepository } from "../infra/config.repository";

export async function updateConfigUseCase(data: {
  votingStartsAt: string | null;
  votingEndsAt: string | null;
  votingEnabled: boolean;
  maxRiskScore: number;
}) {
  const config = await ConfigRepository.upsert({
    votingStartsAt: data.votingStartsAt ? new Date(data.votingStartsAt) : null,
    votingEndsAt: data.votingEndsAt ? new Date(data.votingEndsAt) : null,
    votingEnabled: data.votingEnabled,
    maxRiskScore: data.maxRiskScore,
  });

  logger.info(
    {
      votingEnabled: data.votingEnabled,
      votingStartsAt: data.votingStartsAt,
      votingEndsAt: data.votingEndsAt,
      maxRiskScore: data.maxRiskScore,
    },
    "Platform voting configuration updated",
  );

  return config;
}
