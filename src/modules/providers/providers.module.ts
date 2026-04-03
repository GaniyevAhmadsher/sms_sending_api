import { Module } from '@nestjs/common';
import { MockSmsProvider } from './mock-sms.provider';
import { SMS_PROVIDER_TOKEN } from './providers.constants';
import { PriorityRoutingStrategy } from './routing/priority-routing.strategy';

@Module({
  providers: [
    MockSmsProvider,
    {
      provide: SMS_PROVIDER_TOKEN,
      useExisting: MockSmsProvider,
    },
    PriorityRoutingStrategy,
  ],
  exports: [SMS_PROVIDER_TOKEN, PriorityRoutingStrategy],
})
export class ProvidersModule {}
