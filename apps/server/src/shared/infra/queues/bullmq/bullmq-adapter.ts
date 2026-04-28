import { Queue, Worker, Job } from "bullmq";
import { env } from "../../env/env";
import type { JobOptions, JobReference, QueueHealth, QueueService } from "../queue-interface";
import { createChildLogger } from "../../observability/logger/logger";

const log = createChildLogger({ service: 'queue' });

const PRIORITY_MAP = {
  high: 1,
  normal: 5,
  low: 10,
};

export interface BullMQAdapterOptions {
  concurrency?: number;
  rateLimit?: { max: number; duration: number };
}

export class BullMQAdapter<TData, TResult = void> implements QueueService<TData, TResult> {

  readonly name: string;
  private queue: Queue;
  private worker: Worker | null = null;
  private options: BullMQAdapterOptions;
  private connectionOptions: { url: string; maxRetriesPerRequest: null; tls?: { rejectUnauthorized: boolean } };

  constructor(name: string, options: BullMQAdapterOptions = {}) {
    this.name = name;
    this.options = options;

    this.connectionOptions = {
      url: env.REDIS_URL,
      maxRetriesPerRequest: null,
      ...(env.REDIS_TLS && { tls: { rejectUnauthorized: false } }),
    };

    this.queue = new Queue(name, {
      connection: this.connectionOptions,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: { age: 24 * 3600, count: 1000 },
        removeOnFail: { age: 7 * 24 * 3600 },
      },
    });
  }

  async enqueue(jobName: string, data: TData, options?: JobOptions): Promise<JobReference> {
    const job = await this.queue.add(jobName, data, {
      priority: options?.priority ? PRIORITY_MAP[options.priority] : PRIORITY_MAP.normal,
      delay: options?.delay,
      jobId: options?.jobId,
    });

    log.info({ jobId: job.id, jobName, queue: this.name }, 'Job enqueued');
    return { id: job.id!, name: jobName };
  }

  startWorker(processor: (data: TData) => Promise<TResult>): void {
    if (this.worker) {
      log.warn({ queue: this.name }, 'Worker already running');
      return;
    }

    this.worker = new Worker(
      this.name,
      async (job: Job) => processor(job.data as TData),
      {
        connection: this.connectionOptions,
        concurrency: this.options.concurrency ?? 5,
        limiter: this.options.rateLimit,
      }
    );

    this.worker.on('completed', (job) => {
      log.info({ jobId: job.id, jobName: job.name }, 'Job completed');
    });

    this.worker.on('failed', (job, error) => {
      log.error({ jobId: job?.id, jobName: job?.name, error: error.message }, 'Job failed');
    });

    this.worker.on('error', (error) => {
      log.error({ queue: this.name, error: error.message }, 'Worker error');
    });

    log.info({ queue: this.name, concurrency: this.options.concurrency ?? 5 }, 'Worker started');
  }

  async stopWorker(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
      log.info({ queue: this.name }, 'Worker stopped');
    }
  }

  async getHealth(): Promise<QueueHealth> {
    try {
      const counts = await this.queue.getJobCounts();

      const stats = {
        waiting: counts.waiting ?? 0,
        active: counts.active ?? 0,
        failed: counts.failed ?? 0,
      };

      if (!this.worker) {
        return { status: 'degraded', message: 'Worker not running', stats };
      }

      if (counts.failed > 100) {
        return { status: 'degraded', message: `High failed count: ${counts.failed}`, stats };
      }

      return { status: 'healthy', stats };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async close(): Promise<void> {
    await this.stopWorker();
    await this.queue.close();
    log.info({ queue: this.name }, 'Queue closed');
  }
}
