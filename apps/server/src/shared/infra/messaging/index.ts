import { env } from "../env/env";
import { evolutionSender } from "./evolution-sender";
import type { MessageSender } from "./message-sender";
import { mockSender } from "./mock-sender";

let cached: MessageSender | null = null;

export function getMessageSender(): MessageSender {
  if (cached) return cached;

  if (env.NODE_ENV === "test" || env.MESSAGE_SENDER === "mock") {
    cached = mockSender;
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
