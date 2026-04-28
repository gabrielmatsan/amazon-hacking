import type { JobOptions, JobReference } from "../../queue-interface";
import { BullMQAdapter } from "../bullmq-adapter";
import type { EmailJobName, EmailJobPayload } from "./email.types";

export const emailQueue = new BullMQAdapter<EmailJobPayload>('email-jobs', {
  concurrency: 1,
  rateLimit: { max: 10, duration: 1000 },
});

export async function queueEmail(
  name: EmailJobName,
  payload: EmailJobPayload,
  options?: JobOptions
): Promise<JobReference> {
  return emailQueue.enqueue(name, payload, options);
}

export async function stopEmailQueue(): Promise<void> {
  await emailQueue.stopWorker();
}
