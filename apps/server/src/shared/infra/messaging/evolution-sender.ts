import { env } from "../env/env";
import { logger } from "../observability";
import { MessageSendError, type MessageSender } from "./message-sender";

const MAX_RETRIES = 1;

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

async function restartInstance(
  url: string,
  apiKey: string,
  instance: string,
): Promise<void> {
  logger.warn({ instance }, "Restarting Evolution instance");

  const restartRes = await fetch(`${url}/instance/restart/${instance}`, {
    method: "PUT",
    headers: { apikey: apiKey },
  });

  if (!restartRes.ok) {
    throw new MessageSendError(
      `Failed to restart instance: ${restartRes.status}`,
    );
  }

  await new Promise((r) => setTimeout(r, 5000));
}

function isConnectionClosed(status: number, body: string): boolean {
  return status === 500 && body.includes("Connection Closed");
}

// Evolution expects the phone in digits only (E.164 without leading "+")
function toEvolutionNumber(phoneE164: string): string {
  return phoneE164.replace(/^\+/, "");
}

async function sendText(
  url: string,
  apiKey: string,
  instance: string,
  phoneE164: string,
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
      number: toEvolutionNumber(phoneE164),
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
      let result = await sendText(url, apiKey, instance, phoneE164, body, controller.signal);

      if (!result.ok && isConnectionClosed(result.status, result.errorText)) {
        logger.warn(
          { status: result.status, phoneE164 },
          "Connection closed, attempting restart and retry",
        );

        await restartInstance(url, apiKey, instance);
        result = await sendText(url, apiKey, instance, phoneE164, body, controller.signal);
      }

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
  },
};
