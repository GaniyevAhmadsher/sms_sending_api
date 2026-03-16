import { Module } from '@nestjs/common';
import { SmsController } from './sms.controller';
import { SmsService } from './sms.service';
import { QueueModule } from '../queue/queue.module';
import { BillingModule } from '../billing/billing.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { ApiKeyRateLimitGuard } from '../api-keys/guards/api-key-rate-limit.guard';

@Module({
  imports: [QueueModule, BillingModule, ApiKeysModule],
  controllers: [SmsController],
  providers: [SmsService, ApiKeyRateLimitGuard],
})
export class SmsModule {}
