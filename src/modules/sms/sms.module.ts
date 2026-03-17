import { Module } from '@nestjs/common';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { BillingModule } from '../billing/billing.module';
import { QueueModule } from '../queue/queue.module';
import { SmsController } from './sms.controller';
import { SmsService } from './sms.service';

@Module({
  imports: [QueueModule, BillingModule, ApiKeysModule],
  controllers: [SmsController],
  providers: [SmsService],
})
export class SmsModule {}
