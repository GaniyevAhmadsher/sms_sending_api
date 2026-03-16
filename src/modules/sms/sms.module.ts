import { Module } from '@nestjs/common';
import { SmsController } from './sms.controller';
import { SmsService } from './sms.service';
import { QueueModule } from '../queue/queue.module';
import { BillingModule } from '../billing/billing.module';
import { ApiKeyGuard } from '../api-keys/guards/api-key.guard';

@Module({
  imports: [QueueModule, BillingModule],
  controllers: [SmsController],
  providers: [SmsService, ApiKeyGuard],
})
export class SmsModule {}
