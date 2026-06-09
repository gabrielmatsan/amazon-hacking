import { env } from "../env/env";
import { logger } from "../observability";
import { MessageSendError, type MessageSender } from "./message-sender";

interface VonageCredentials {
  apiKey: string;
  apiSecret: string;
}

// Vonage credential pairs in order of preference. The primary account is tried
// first; if a send fails with it, we fall back to the secondary account.
// Incomplete pairs (missing key or secret) are dropped so misconfigured slots
// don't waste an attempt.
function requireConfig(): {
  url: string;
  credentials: VonageCredentials[];
  from: string;
} {
  const credentials: VonageCredentials[] = [
    { apiKey: env.VONAGE_API_KEY, apiSecret: env.VONAGE_API_SECRET },
    { apiKey: env.VONAGE_API_KEY_2, apiSecret: env.VONAGE_API_SECRET_2 },
  ].filter(
    (pair): pair is VonageCredentials =>
      Boolean(pair.apiKey) && Boolean(pair.apiSecret),
  );

  if (credentials.length === 0 || !env.VONAGE_FROM) {
    throw new MessageSendError(
      "Vonage sender is not configured (VONAGE_API_KEY, VONAGE_API_SECRET, VONAGE_FROM)",
    );
  }

  return {
    url: env.VONAGE_URL.replace(/\/$/, ""),
    credentials,
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
    const { url, credentials, from } = requireConfig();

    let lastError: MessageSendError | undefined;

    for (let i = 0; i < credentials.length; i++) {
      const { apiKey, apiSecret } = credentials[i];
      const isLastAccount = i === credentials.length - 1;

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

        if (result.ok) return { channel: "sms" };

        logger.warn(
          {
            status: result.status,
            errorText: result.errorText,
            phoneE164,
            accountIndex: i,
            willFallback: !isLastAccount,
          },
          "Vonage API returned a failure",
        );
        lastError = new MessageSendError(
          `Vonage responded ${result.status}: ${result.errorText || "no body"}`,
        );
      } catch (err) {
        logger.error(
          { err, phoneE164, accountIndex: i, willFallback: !isLastAccount },
          "Vonage send failed",
        );
        lastError = new MessageSendError("Failed to dispatch SMS message", err);
      } finally {
        clearTimeout(timer);
      }
    }

    throw (
      lastError ?? new MessageSendError("Failed to dispatch SMS message")
    );
  },
};
