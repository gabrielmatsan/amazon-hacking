import { env } from "../env/env";
import { logger } from "../observability";
import { MessageSendError, type MessageSender } from "./message-sender";

function requireConfig(): {
  url: string;
  apiKey: string;
  apiSecret: string;
  from: string;
} {
  if (!env.VONAGE_API_KEY || !env.VONAGE_API_SECRET || !env.VONAGE_FROM) {
    throw new MessageSendError(
      "Vonage sender is not configured (VONAGE_API_KEY, VONAGE_API_SECRET, VONAGE_FROM)",
    );
  }
  return {
    url: env.VONAGE_URL.replace(/\/$/, ""),
    apiKey: env.VONAGE_API_KEY,
    apiSecret: env.VONAGE_API_SECRET,
    from: env.VONAGE_FROM,
  };
}

// Vonage SMS API expects the recipient as digits only (E.164 without "+").
function toVonageNumber(phoneE164: string): string {
  return phoneE164.replace(/^\+/, "");
}

interface VonageResponse {
  "message-count"?: string;
  messages?: Array<{
    status?: string;
    "error-text"?: string;
    "message-id"?: string;
  }>;
}

async function sendSms(
  url: string,
  params: URLSearchParams,
  signal: AbortSignal,
): Promise<{ ok: boolean; status: number; errorText: string }> {
  const response = await fetch(`${url}/sms/json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: params.toString(),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    return { ok: false, status: response.status, errorText };
  }

  // Vonage returns HTTP 200 even on logical failures; the real outcome lives in
  // messages[].status ("0" = delivered to carrier, anything else is an error).
  const payload = (await response
    .json()
    .catch(() => null)) as VonageResponse | null;
  const message = payload?.messages?.[0];

  if (!message || message.status !== "0") {
    return {
      ok: false,
      status: response.status,
      errorText: message?.["error-text"]
        ? `[${message.status}] ${message["error-text"]}`
        : "Vonage reported a non-zero status",
    };
  }

  return { ok: true, status: response.status, errorText: "" };
}

export const vonageSender: MessageSender = {
  async send(phoneE164, body) {
    const { url, apiKey, apiSecret, from } = requireConfig();

    const params = new URLSearchParams({
      api_key: apiKey,
      api_secret: apiSecret,
      to: toVonageNumber(phoneE164),
      from,
      text: body,
    });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);

    try {
      const result = await sendSms(url, params, controller.signal);

      if (!result.ok) {
        logger.warn(
          { status: result.status, errorText: result.errorText, phoneE164 },
          "Vonage API returned a failure",
        );
        throw new MessageSendError(
          `Vonage responded ${result.status}: ${result.errorText || "no body"}`,
        );
      }
    } catch (err) {
      if (err instanceof MessageSendError) throw err;
      logger.error({ err, phoneE164 }, "Vonage send failed");
      throw new MessageSendError("Failed to dispatch SMS message", err);
    } finally {
      clearTimeout(timer);
    }

    return { channel: "sms" };
  },
};
