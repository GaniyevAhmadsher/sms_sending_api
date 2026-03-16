import { Module } from '@nestjs/common';
import { MockSmsProvider } from './mock-sms.provider';
import { SMS_PROVIDER_TOKEN } from './providers.constants';

@Module({
  providers: [
    MockSmsProvider,
    {
      provide: SMS_PROVIDER_TOKEN,
      useFactory: (mock: MockSmsProvider) => {
        const selected = process.env.SMS_PROVIDER ?? 'mock';
        if (selected !== 'mock') {
          return mock;
        }
        return mock;
      },
      inject: [MockSmsProvider],
    },
  ],
  exports: [SMS_PROVIDER_TOKEN],
})
export class ProvidersModule {}
