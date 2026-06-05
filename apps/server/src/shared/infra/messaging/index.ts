import { env } from "../env/env";
import { araraSender } from "./arara-sender";
import { evolutionSender, sendEvolutionAlert } from "./evolution-sender";
import { createFallbackSender } from "./fallback-sender";
import type { MessageSender } from "./message-sender";
import { mockSender } from "./mock-sender";
import { vonageSender } from "./vonage-sender";

let cached: MessageSender | null = null;

export function getMessageSender(): MessageSender {
  if (cached) return cached;

  if (env.NODE_ENV === "test" || env.MESSAGE_SENDER === "mock") {
    cached = mockSender;
  } else if (env.MESSAGE_SENDER === "arara") {
    // Arara primary, Vonage SMS as fallback. The vote-token use case still
    // falls back to email if both providers fail.
    cached = createFallbackSender([
      { name: "arara", sender: araraSender },
      { name: "vonage", sender: vonageSender },
    ]);
  } else if (env.MESSAGE_SENDER === "vonage") {
    cached = vonageSender;
  } else {
    cached = evolutionSender;
  }

  return cached;
}

export function setMessageSenderForTests(sender: MessageSender | null): void {
  cached = sender;
}

export type { MessageSender } from "./message-sender";
export { MessageSendError } from "./message-sender";
export { sendEvolutionAlert };
