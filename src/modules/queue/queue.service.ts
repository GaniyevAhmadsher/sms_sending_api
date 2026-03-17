import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { SMS_QUEUE } from './queue.constants';

export interface SmsJobPayload {
  smsId: string;
  userId: string;
  to: string;
  body: string;
  attempt?: number;
  retryAt?: number;
}

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(private readonly redisService: RedisService) {}

  async enqueueSmsJob(payload: SmsJobPayload) {
    await this.redisService.rpush(SMS_QUEUE, JSON.stringify({ ...payload, attempt: payload.attempt ?? 1 }));
    this.logger.log(`Enqueued sms job ${payload.smsId}`);
  }
}
