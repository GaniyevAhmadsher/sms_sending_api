import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { MetricsService } from '../../infrastructure/observability/metrics.service';
import { PAYMENT_WEBHOOK_QUEUE, SMS_DLQ, SMS_QUEUE } from './queue.constants';
import { SmsQueue } from './sms.queue';

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
    await this.refreshQueueMetrics();
  }

  async enqueuePaymentWebhookJob(payload: PaymentWebhookJobPayload) {
    const jobId = payload.jobId ?? `payment-webhook:${payload.eventId}`;
    await this.redisService.rpush(
      PAYMENT_WEBHOOK_QUEUE,
      JSON.stringify({ ...payload, jobId, attempt: payload.attempt ?? 1 }),
    );
    this.logger.log(`Enqueued payment webhook job ${jobId}`);
    await this.refreshQueueMetrics();
  }

  async refreshQueueMetrics() {
    const [depth, dlq] = await Promise.all([
      this.redisService.llen(SMS_QUEUE),
      this.redisService.llen(SMS_DLQ),
    ]);

    this.metrics.setGauge('queue_depth', depth);
    this.metrics.setGauge('dlq_size', dlq);
  }
}
