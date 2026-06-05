import { logger } from "../observability";
import type { MessageSender } from "./message-sender";

export const mockSender: MessageSender = {
  async send(phoneNumber, body) {
    logger.info({ phoneNumber, body }, "[MockSender] message dispatched");
    return { channel: "whatsapp" };
  },
};
