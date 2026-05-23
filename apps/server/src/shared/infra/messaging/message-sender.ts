export interface MessageSender {
  send(phoneNumber: string, body: string): Promise<void>;
}

export class MessageSendError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = "MessageSendError";
  }
}
