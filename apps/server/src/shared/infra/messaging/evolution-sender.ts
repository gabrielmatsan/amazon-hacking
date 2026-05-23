import { env } from "../env/env";
import { logger } from "../observability";
import { MessageSendError, type MessageSender } from "./message-sender";



function requireConfig(): {
  url: string;
  apiKey: string;
  instance: string;
} {
  if (!env.EVOLUTION_URL || !env.EVOLUTION_API_KEY || !env.EVOLUTION_INSTANCE) {
    throw new MessageSendError(
      "Evolution sender is not configured (EVOLUTION_URL, EVOLUTION_API_KEY, EVOLUTION_INSTANCE)",
    );
  }
  return {
    url: env.EVOLUTION_URL.replace(/\/$/, ""),
    apiKey: env.EVOLUTION_API_KEY,
    instance: env.EVOLUTION_INSTANCE,
  };
}

// Evolution expects the phone in digits only (E.164 without leading "+")
function toEvolutionNumber(phoneE164: string): string {
  return phoneE164.replace(/^\+/, "");
}

export const evolutionSender: MessageSender = {
  async send(phoneE164, body) {
    const { url, apiKey, instance } = requireConfig();
    const endpoint = `${url}/message/sendText/${instance}`;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: apiKey,
        },
        body: JSON.stringify({
          number: toEvolutionNumber(phoneE164),
          text: body,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        logger.warn(
          { status: response.status, errorText, phoneE164 },
          "Evolution API returned non-2xx",
        );
        throw new MessageSendError(
          `Evolution responded ${response.status}: ${errorText || "no body"}`,
        );
      }
    } catch (err) {
      if (err instanceof MessageSendError) throw err;
      logger.error({ err, phoneE164 }, "Evolution send failed");
      throw new MessageSendError("Failed to dispatch WhatsApp message", err);
    } finally {
      clearTimeout(timer);
    }
  },
};
