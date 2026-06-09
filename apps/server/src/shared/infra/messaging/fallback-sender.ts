import { logger } from "../observability";
import { MessageSendError, type MessageSender } from "./message-sender";

interface NamedSender {
  name: string;
  sender: MessageSender;
}

// Wraps an ordered list of senders and tries each one until a send succeeds.
// If every provider fails, the last error is rethrown so callers (e.g. the
// vote-token use case) can still apply their own final fallback (email).
export function createFallbackSender(senders: NamedSender[]): MessageSender {
  if (senders.length === 0) {
    throw new Error("createFallbackSender requires at least one sender");
  }

  return {
    async send(phoneNumber, body, options) {
      let lastError: unknown;

      for (let i = 0; i < senders.length; i++) {
        const { name, sender } = senders[i];
        const isLast = i === senders.length - 1;

        try {
          const result = await sender.send(phoneNumber, body, options);
          if (i > 0) {
            logger.info({ provider: name }, "Message delivered via fallback provider");
          }
          return result;
        } catch (err) {
          lastError = err;
          logger.warn(
            { err, provider: name, willFallback: !isLast },
            "Message provider failed",
          );
        }
      }

      throw lastError instanceof MessageSendError
        ? lastError
        : new MessageSendError("All message providers failed", lastError);
    },
  };
}
