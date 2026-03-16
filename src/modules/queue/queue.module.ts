import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { SmsProcessor } from './sms.processor';
import { ProvidersModule } from '../providers/providers.module';

@Module({
  imports: [ProvidersModule],
  providers: [QueueService, SmsProcessor],
  exports: [QueueService],
})
export class QueueModule {}
