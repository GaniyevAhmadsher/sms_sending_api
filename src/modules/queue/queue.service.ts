import { Injectable } from '@nestjs/common';
import { SmsProcessor } from './sms.processor';

@Injectable()
export class QueueService {
  constructor(private readonly smsProcessor: SmsProcessor) {}

  async enqueueSmsJob(payload: { smsId: string; userId: string; to: string; body: string }) {
    setTimeout(() => {
      void this.smsProcessor.process(payload);
    }, 0);
  }
}
