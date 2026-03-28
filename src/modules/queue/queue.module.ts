import { Module, forwardRef } from '@nestjs/common';
import { ProvidersModule } from '../providers/providers.module';
import { PaymentsModule } from '../payments/payments.module';
import { PaymentWebhookProcessor } from './payment-webhook.processor';
import { SmsProcessor } from './sms.processor';
import { QueueService } from './queue.service';

@Module({
  imports: [ProvidersModule, forwardRef(() => PaymentsModule)],
  providers: [QueueService, SmsProcessor, PaymentWebhookProcessor],
  exports: [QueueService],
})
export class QueueModule {}
