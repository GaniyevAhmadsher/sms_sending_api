import { Module } from '@nestjs/common';
import { ProvidersModule } from '../providers/providers.module';
import { SmsProcessor } from './sms.processor';
import { QueueService } from './queue.service';

@Module({
  imports: [ProvidersModule],
  providers: [QueueService, SmsProcessor],
  exports: [QueueService],
})
export class QueueModule {}
