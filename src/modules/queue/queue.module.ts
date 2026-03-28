import { Module, forwardRef } from '@nestjs/common';
import { AppConfigService } from '../../infrastructure/config/app-config.service';
import { PaymentsModule } from '../payments/payments.module';
import { ProvidersModule } from '../providers/providers.module';
import { BULLMQ_CONNECTION, SMS_BULLMQ_QUEUE, SMS_QUEUE } from './queue.constants';
import { PaymentWebhookProcessor } from './payment-webhook.processor';
import { QueueService } from './queue.service';
import { SmsProcessor } from './sms.processor';
import { SmsQueue } from './sms.queue';

@Module({
  imports: [ProvidersModule, forwardRef(() => PaymentsModule)],
  providers: [
    {
      provide: BULLMQ_CONNECTION,
      inject: [AppConfigService],
      useFactory: async (config: AppConfigService) => {
        const { default: IORedis } = await import('ioredis');
        return new IORedis({
          host: config.redisHost,
          port: config.redisPort,
          password: config.redisPassword,
          maxRetriesPerRequest: null,
        });
      },
    },
    {
      provide: SMS_BULLMQ_QUEUE,
      inject: [BULLMQ_CONNECTION],
      useFactory: async (connection: unknown) => {
        const { Queue } = await import('bullmq');
        return new Queue(SMS_QUEUE, {
          connection,
        });
      },
    },
    QueueService,
    SmsQueue,
    SmsProcessor,
    PaymentWebhookProcessor,
  ],
  exports: [QueueService, SmsQueue, SMS_BULLMQ_QUEUE, BULLMQ_CONNECTION],
})
export class QueueModule {}
