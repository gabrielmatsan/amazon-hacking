export interface JobOptions {
  priority?: "high" | "normal" | "low";
  delay?: number;
  jobId?: string;
}

export interface JobReference {
  id: string;
  name: string;
}

export interface QueueHealth {
  status: "healthy" | "degraded" | "unhealthy";
  message?: string;
  stats?: { waiting: number; active: number; failed: number };
}

export interface QueueService<TData, TResult = void> {
  readonly name: string;

  enqueue(name: string, data: TData, options?: JobOptions): Promise<JobReference>;

  startWorker(processor: (data: TData) => Promise<TResult>): void;
  stopWorker(): Promise<void>;

  getHealth(): Promise<QueueHealth>;
  close(): Promise<void>;
}
