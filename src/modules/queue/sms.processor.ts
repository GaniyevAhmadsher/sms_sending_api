import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { SMS_PROVIDER_TOKEN } from '../providers/providers.constants';
import type { SmsProvider } from '../providers/providers.interface';
import { SEND_SMS_JOB, SMS_DLQ, SMS_QUEUE } from './queue.constants';
import type { SmsJobPayload } from './queue.service';

@Injectable()
export class SmsProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SmsProcessor.name);
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    @Inject(SMS_PROVIDER_TOKEN) private readonly smsProvider: SmsProvider,
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
    const raw = await this.redisService.lpop(SMS_QUEUE);
    if (!raw) return;

    const payload = JSON.parse(raw) as SmsJobPayload;
    if (payload.retryAt && payload.retryAt > Date.now()) {
      await this.redisService.rpush(SMS_QUEUE, JSON.stringify(payload));
      return;
    }

    await this.process(payload);
  }

  private async process(payload: SmsJobPayload) {
    try {
      const result = await this.smsProvider.send({ to: payload.to, body: payload.body });
      await this.prisma.smsMessage.update({
        where: { id: payload.smsId },
        data: {
          provider: result.provider,
          providerRef: result.providerRef,
          status: 'SENT',
          sentAt: new Date(),
        },
      });
      this.logger.log(`${SEND_SMS_JOB} success ${payload.jobId ?? payload.smsId}`);
    } catch (error) {
      const attempt = payload.attempt ?? 1;
      if (attempt < 5) {
        const delayMs = Math.min(30_000, 2 ** attempt * 1000);
        await this.redisService.rpush(
          SMS_QUEUE,
          JSON.stringify({ ...payload, attempt: attempt + 1, retryAt: Date.now() + delayMs }),
        );
      } else {
        await this.prisma.smsMessage.update({
          where: { id: payload.smsId },
          data: {
            status: 'FAILED',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          },
        });
        await this.redisService.rpush(
          SMS_DLQ,
          JSON.stringify({ ...payload, finalError: error instanceof Error ? error.message : 'Unknown error' }),
        );
      }

      this.logger.error(`Failed to process SMS ${payload.smsId} on attempt ${attempt}`);
    }
  }
}
