export interface SendOptions {
  /**
   * Verification token/code. Template-based providers (e.g. Arara) send it as
   * the single template variable; free-form providers ignore it and use `body`.
   */
  code?: string;
}

export interface MessageSender {
  send(phoneNumber: string, body: string, options?: SendOptions): Promise<void>;
}

export class MessageSendError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "MessageSendError";
  }
}
