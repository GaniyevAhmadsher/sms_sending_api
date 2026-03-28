import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { PaymentsService } from '../payments/payments.service';
import {
  PAYMENT_WEBHOOK_DLQ,
  PAYMENT_WEBHOOK_QUEUE,
  PROCESS_PAYMENT_WEBHOOK_JOB,
} from './queue.constants';
import type { PaymentWebhookJobPayload } from './queue.service';

@Injectable()
export class PaymentWebhookProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PaymentWebhookProcessor.name);
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly redisService: RedisService,
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => {
      void this.pollOnce();
    }, 100);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  private async pollOnce() {
    const raw = await this.redisService.lpop(PAYMENT_WEBHOOK_QUEUE);
    if (!raw) return;

    const payload = JSON.parse(raw) as PaymentWebhookJobPayload;
    if (payload.retryAt && payload.retryAt > Date.now()) {
      await this.redisService.rpush(PAYMENT_WEBHOOK_QUEUE, JSON.stringify(payload));
      return;
    }

    try {
      await this.paymentsService.processWebhookEvent(payload.eventId);
      await this.prisma.webhookEvent.update({ where: { id: payload.eventId }, data: { status: 'PROCESSED' } });
      this.logger.log(`${PROCESS_PAYMENT_WEBHOOK_JOB} success event=${payload.eventId}`);
    } catch (error) {
      const attempt = payload.attempt ?? 1;
      if (attempt < 5) {
        const delayMs = Math.min(60_000, 2 ** attempt * 1000);
        await this.redisService.rpush(
          PAYMENT_WEBHOOK_QUEUE,
          JSON.stringify({ ...payload, attempt: attempt + 1, retryAt: Date.now() + delayMs }),
        );
        await this.prisma.webhookEvent.update({
          where: { id: payload.eventId },
          data: { status: 'RETRYING', attempts: attempt + 1, lastError: error instanceof Error ? error.message : 'Unknown' },
        });
      } else {
        await this.redisService.rpush(
          PAYMENT_WEBHOOK_DLQ,
          JSON.stringify({ ...payload, finalError: error instanceof Error ? error.message : 'Unknown' }),
        );
        await this.prisma.webhookEvent.update({
          where: { id: payload.eventId },
          data: { status: 'DEAD_LETTER', attempts: attempt, lastError: error instanceof Error ? error.message : 'Unknown' },
        });
      }
      this.logger.error(`Webhook event processing failed: ${payload.eventId}`);
    }
  }
}
