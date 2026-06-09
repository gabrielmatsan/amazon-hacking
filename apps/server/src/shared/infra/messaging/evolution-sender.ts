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

function toEvolutionGroupId(groupId: string): string {
  if (groupId.endsWith("@g.us")) return groupId;
  return `${groupId}@g.us`;
}

async function sendText(
  url: string,
  apiKey: string,
  instance: string,
  recipient: string,
  body: string,
  signal: AbortSignal,
): Promise<{ ok: boolean; status: number; errorText: string }> {
  const endpoint = `${url}/message/sendText/${instance}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: apiKey,
    },
    body: JSON.stringify({
      number: recipient,
      text: body,
    }),
    signal,
  });

  if (response.ok) {
    return { ok: true, status: response.status, errorText: "" };
  }

  const errorText = await response.text().catch(() => "");
  return { ok: false, status: response.status, errorText };
}

export const evolutionSender: MessageSender = {
  async send(phoneE164, body) {
    const { url, apiKey, instance } = requireConfig();

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);

    try {
      const result = await sendText(
        url,
        apiKey,
        instance,
        toEvolutionNumber(phoneE164),
        body,
        controller.signal,
      );

      if (!result.ok) {
        logger.warn(
          { status: result.status, errorText: result.errorText, phoneE164 },
          "Evolution API returned non-2xx",
        );
        throw new MessageSendError(
          `Evolution responded ${result.status}: ${result.errorText || "no body"}`,
        );
      }
    } catch (err) {
      if (err instanceof MessageSendError) throw err;
      logger.error({ err, phoneE164 }, "Evolution send failed");
      throw new MessageSendError("Failed to dispatch WhatsApp message", err);
    } finally {
      clearTimeout(timer);
    }

    return { channel: "whatsapp" };
  },
};

export async function sendEvolutionAlert(body: string): Promise<void> {
  if (!env.EVOLUTION_ALERTS_ENABLED) return;

  if (!env.EVOLUTION_ALERT_GROUP_ID) {
    logger.warn("Evolution alerts are enabled but EVOLUTION_ALERT_GROUP_ID is not configured");
    return;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);

  try {
    const { url, apiKey, instance } = requireConfig();
    const result = await sendText(
      url,
      apiKey,
      instance,
      toEvolutionGroupId(env.EVOLUTION_ALERT_GROUP_ID),
      body,
      controller.signal,
    );

    if (!result.ok) {
      logger.warn(
        { status: result.status, errorText: result.errorText },
        "Evolution alert returned non-2xx",
      );
    }
  } catch (err) {
    logger.warn({ err }, "Evolution alert failed");
  } finally {
    clearTimeout(timer);
  }
}
