import { Inject, Injectable, Logger } from '@nestjs/common';
import { SEND_SMS_JOB, SMS_BULLMQ_QUEUE } from './queue.constants';

export interface SmsJobPayload {
  smsId: string;
  userId: string;
}

interface SmsQueueClient {
  add: (name: string, payload: SmsJobPayload, options: Record<string, unknown>) => Promise<{ id?: string }>;
}

@Injectable()
export class SmsQueue {
  private readonly logger = new Logger(SmsQueue.name);

  constructor(@Inject(SMS_BULLMQ_QUEUE) private readonly smsQueue: SmsQueueClient) {}

  async enqueue(payload: SmsJobPayload) {
    const job = await this.smsQueue.add(SEND_SMS_JOB, payload, {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 3000,
      },
      removeOnComplete: true,
      removeOnFail: false,
      jobId: `sms:${payload.smsId}`,
    });

    this.logger.log(`Enqueued sms job ${job.id}`);
    return job;
  }
}
