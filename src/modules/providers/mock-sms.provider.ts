import { Injectable } from '@nestjs/common';
import { SmsProvider, SendSmsInput, SendSmsResult } from './providers.interface';

@Injectable()
export class MockSmsProvider implements SmsProvider {
  async send(input: SendSmsInput): Promise<SendSmsResult> {
    const providerRef = `mock_${Date.now()}_${input.to.slice(-4)}`;
    return {
      provider: 'mock-sms',
      providerRef,
    };
  }
}
