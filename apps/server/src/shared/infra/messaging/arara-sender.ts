import { env } from "../env/env";
import { logger } from "../observability";
import { MessageSendError, type MessageSender } from "./message-sender";

// Outbound (HSM) template used to deliver verification tokens. Its single
// variable {{1}} is the token code.
const TOKEN_TEMPLATE_NAME = "envio_de_token";

function requireConfig(): { url: string; apiKey: string } {
  if (!env.ARARA_API_KEY) {
    throw new MessageSendError("Arara sender is not configured (ARARA_API_KEY)");
  }
  return {
    url: env.ARARA_URL.replace(/\/$/, ""),
    apiKey: env.ARARA_API_KEY,
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
    const { url, apiKey } = requireConfig();

    const code = options?.code ?? body;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);

    try {
      const result = await postMessage(
        url,
        apiKey,
        {
          receiver: toAraraReceiver(phoneE164),
          templateName: TOKEN_TEMPLATE_NAME,
          variables: [code],
        },
        controller.signal,
      );

      if (!result.ok) {
        logger.warn(
          { status: result.status, errorText: result.errorText, phoneE164 },
          "Arara API returned non-2xx",
        );
        throw new MessageSendError(
          `Arara responded ${result.status}: ${result.errorText || "no body"}`,
        );
      }
    } catch (err) {
      if (err instanceof MessageSendError) throw err;
      logger.error({ err, phoneE164 }, "Arara send failed");
      throw new MessageSendError("Failed to dispatch WhatsApp message", err);
    } finally {
      clearTimeout(timer);
    }
  },
};
