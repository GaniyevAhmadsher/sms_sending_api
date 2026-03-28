import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { PAYMENT_WEBHOOK_QUEUE, SMS_QUEUE } from './queue.constants';

export interface SmsJobPayload {
  smsId: string;
  userId: string;
  to: string;
  body: string;
  attempt?: number;
  retryAt?: number;
  jobId?: string;
}

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

  constructor(private readonly redisService: RedisService) {}

  async enqueueSmsJob(payload: SmsJobPayload) {
    const jobId = payload.jobId ?? `sms:${payload.smsId}`;
    await this.redisService.rpush(
      SMS_QUEUE,
      JSON.stringify({ ...payload, jobId, attempt: payload.attempt ?? 1 }),
    );
    this.logger.log(`Enqueued sms job ${jobId}`);
  }

  async enqueuePaymentWebhookJob(payload: PaymentWebhookJobPayload) {
    const jobId = payload.jobId ?? `payment-webhook:${payload.eventId}`;
    await this.redisService.rpush(
      PAYMENT_WEBHOOK_QUEUE,
      JSON.stringify({ ...payload, jobId, attempt: payload.attempt ?? 1 }),
    );
    this.logger.log(`Enqueued payment webhook job ${jobId}`);
  }
}
