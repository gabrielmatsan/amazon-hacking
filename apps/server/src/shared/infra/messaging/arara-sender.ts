import { env } from "../env/env";
import { logger } from "../observability";
import { MessageSendError, type MessageSender } from "./message-sender";

// Outbound (HSM) template used to deliver verification tokens. Its single
// variable {{1}} is the token code.
const TOKEN_TEMPLATE_NAME = "envio_de_token";

// Arara API keys in order of preference. ARARA_API_KEY_2 is tried first; if a
// send fails with it, we fall back to ARARA_API_KEY. Empty/undefined keys are
// dropped so misconfigured slots don't waste an attempt.
function requireConfig(): { url: string; apiKeys: string[] } {
  const apiKeys = [env.ARARA_API_KEY_2, env.ARARA_API_KEY].filter(
    (key): key is string => Boolean(key),
  );

  if (apiKeys.length === 0) {
    throw new MessageSendError(
      "Arara sender is not configured (ARARA_API_KEY_2 / ARARA_API_KEY)",
    );
  }

  return {
    url: env.ARARA_URL.replace(/\/$/, ""),
    apiKeys,
  };
}

// Arara expects the recipient in E.164 with a "whatsapp:+" prefix
function toAraraReceiver(phoneE164: string): string {
  const withPlus = phoneE164.startsWith("+") ? phoneE164 : `+${phoneE164}`;
  return `whatsapp:${withPlus}`;
}

async function postMessage(
  url: string,
  apiKey: string,
  body: Record<string, unknown>,
  signal: AbortSignal,
): Promise<{ ok: boolean; status: number; errorText: string }> {
  const response = await fetch(`${url}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal,
  });

  if (response.ok) {
    return { ok: true, status: response.status, errorText: "" };
  }

  const errorText = await response.text().catch(() => "");
  return { ok: false, status: response.status, errorText };
}

export const araraSender: MessageSender = {
  async send(phoneE164, body, options) {
    const { url, apiKeys } = requireConfig();

    const code = options?.code ?? body;
    const requestBody = {
      receiver: toAraraReceiver(phoneE164),
      templateName: TOKEN_TEMPLATE_NAME,
      variables: [code],
    };

    let lastError: MessageSendError | undefined;

    for (let i = 0; i < apiKeys.length; i++) {
      const apiKey = apiKeys[i];
      const isLastKey = i === apiKeys.length - 1;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20_000);

      try {
        const result = await postMessage(
          url,
          apiKey,
          requestBody,
          controller.signal,
        );

        if (result.ok) return { channel: "whatsapp" };

        logger.warn(
          {
            status: result.status,
            errorText: result.errorText,
            phoneE164,
            keyIndex: i,
            willFallback: !isLastKey,
          },
          "Arara API returned non-2xx",
        );
        lastError = new MessageSendError(
          `Arara responded ${result.status}: ${result.errorText || "no body"}`,
        );
      } catch (err) {
        logger.error(
          { err, phoneE164, keyIndex: i, willFallback: !isLastKey },
          "Arara send failed",
        );
        lastError = new MessageSendError(
          "Failed to dispatch WhatsApp message",
          err,
        );
      } finally {
        clearTimeout(timer);
      }
    }

    throw (
      lastError ?? new MessageSendError("Failed to dispatch WhatsApp message")
    );
  },
};


