import { Module } from '@nestjs/common';
import { OnboardingController } from './onboarding.controller';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { PaymentsModule } from '../payments/payments.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [ApiKeysModule, PaymentsModule, AnalyticsModule],
  controllers: [OnboardingController],
})
export class OnboardingModule {}
