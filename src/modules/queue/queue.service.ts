import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { PAYMENT_WEBHOOK_QUEUE } from './queue.constants';
import { SmsQueue } from './sms.queue';
import { MetricsService } from '../../infrastructure/metrics/metrics.service';

export interface PaymentWebhookJobPayload {
  eventId: string;
  provider: 'CLICK' | 'PAYME';
  attempt?: number;
  retryAt?: number;
  jobId?: string;
}

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly smsQueue: SmsQueue,
    private readonly metrics: MetricsService,
  ) {}

  async enqueueSmsJob(payload: { smsId: string; userId: string }) {
    await this.smsQueue.enqueue(payload);
    this.metrics.queueDepth.inc({ queue: 'sms' });
  }

  async enqueuePaymentWebhookJob(payload: PaymentWebhookJobPayload) {
    const jobId = payload.jobId ?? `payment-webhook:${payload.eventId}`;
    await this.redisService.rpush(
      PAYMENT_WEBHOOK_QUEUE,
      JSON.stringify({ ...payload, jobId, attempt: payload.attempt ?? 1 }),
    );
    this.logger.log(`Enqueued payment webhook job ${jobId}`);
    this.metrics.queueDepth.inc({ queue: 'payment_webhook' });
  }
}
