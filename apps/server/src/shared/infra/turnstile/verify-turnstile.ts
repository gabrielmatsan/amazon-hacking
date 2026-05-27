import { env } from "../env/env";
import { BadRequestError } from "../errors/bad-error-request";

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface TurnstileResponse {
  success: boolean;
  "error-codes": string[];
}

export async function verifyTurnstileToken(token: string, ip?: string): Promise<void> {
  const body: Record<string, string> = {
    secret: env.TURNSTILE_SECRET_KEY,
    response: token,
  };

  if (ip) body.remoteip = ip;

  const res = await fetch(TURNSTILE_VERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as TurnstileResponse;

  if (!data.success) {
    throw new BadRequestError("Captcha verification failed");
  }
}
