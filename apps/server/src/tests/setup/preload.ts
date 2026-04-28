import { mock } from "bun:test";

// Mock email queue (avoids Redis connection in tests)
mock.module("@/shared/infra/queues/bullmq/mail/email-queue", () => ({
  emailQueue: {
    enqueue: async (_name: string, _data: unknown) => ({ id: "mock-job-id", name: _name }),
    startWorker: () => {},
    stopWorker: async () => {},
    getHealth: async () => ({ status: "healthy" as const }),
    close: async () => {},
    name: "email-jobs",
  },
  queueEmail: async (_name: string, _payload: unknown) => ({ id: "mock-job-id", name: _name }),
  stopEmailQueue: async () => {},
}));

mock.module("@/shared/infra/queues/bullmq/mail/email-worker", () => ({
  startEmailWorker: () => {},
  stopEmailWorker: async () => {},
}));

console.log("Test mocks loaded");
