import { env } from "../env/env";
import { logger } from "../observability";
import { MessageSendError, type MessageSender } from "./message-sender";

function requireConfig(): { url: string; apiKey: string } {
  if (!env.SMSDEV_API_KEY) {
    throw new MessageSendError(
      "SMS Dev sender is not configured (SMSDEV_API_KEY)",
    );
  }
  return {
    url: env.SMSDEV_URL.replace(/\/$/, ""),
    apiKey: env.SMSDEV_API_KEY,
  };
}

// SMS Dev expects the recipient as digits only (E.164 without "+").
function toSmsDevNumber(phoneE164: string): string {
  return phoneE164.replace(/^\+/, "");
}

interface SmsDevResponse {
  situacao?: string;
  codigo?: string;
  id?: string;
  descricao?: string;
}

async function sendSms(
  url: string,
  body: Record<string, unknown>,
  signal: AbortSignal,
): Promise<{ ok: boolean; status: number; errorText: string }> {
  const response = await fetch(`${url}/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    return { ok: false, status: response.status, errorText };
  }

  // SMS Dev returns HTTP 200 even on logical failures; the real outcome lives
  // in `situacao` ("OK" = queued, "ERRO" = failure with `codigo`/`descricao`).
  const payload = (await response
    .json()
    .catch(() => null)) as SmsDevResponse | null;

  if (!payload || payload.situacao !== "OK") {
    return {
      ok: false,
      status: response.status,
      errorText: payload?.descricao
        ? `[${payload.codigo ?? "?"}] ${payload.descricao}`
        : "SMS Dev reported a non-OK situacao",
    };
  }

  return { ok: true, status: response.status, errorText: "" };
}

export const smsDevSender: MessageSender = {
  async send(phoneE164, body) {
    const { url, apiKey } = requireConfig();

    const requestBody = {
      key: apiKey,
      type: 9, // 9 = SMS
      number: toSmsDevNumber(phoneE164),
      msg: body,
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);

    try {
      const result = await sendSms(url, requestBody, controller.signal);

      if (!result.ok) {
        logger.warn(
          { status: result.status, errorText: result.errorText, phoneE164 },
          "SMS Dev API returned a failure",
        );
        throw new MessageSendError(
          `SMS Dev responded ${result.status}: ${result.errorText || "no body"}`,
        );
      }
    } catch (err) {
      if (err instanceof MessageSendError) throw err;
      logger.error({ err, phoneE164 }, "SMS Dev send failed");
      throw new MessageSendError("Failed to dispatch SMS message", err);
    } finally {
      clearTimeout(timer);
    }

    return { channel: "sms" };
  },
};
