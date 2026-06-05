export interface SendOptions {
  /**
   * Verification token/code. Template-based providers (e.g. Arara) send it as
   * the single template variable; free-form providers ignore it and use `body`.
   */
  code?: string;
}

// Which transport actually delivered the message. Distinguishes WhatsApp
// (Arara/Evolution) from SMS (Vonage) so callers can surface it to the user.
export type DeliveryChannel = "whatsapp" | "sms";

export interface SendResult {
  channel: DeliveryChannel;
}

export interface MessageSender {
  send(
    phoneNumber: string,
    body: string,
    options?: SendOptions,
  ): Promise<SendResult>;
}

export class MessageSendError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "MessageSendError";
  }
}
