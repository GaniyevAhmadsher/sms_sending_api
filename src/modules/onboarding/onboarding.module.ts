import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { PaymentsModule } from '../payments/payments.module';
import { OnboardingController } from './onboarding.controller';

@Module({
  imports: [PrismaModule, ApiKeysModule, PaymentsModule, AnalyticsModule],
  controllers: [OnboardingController],
})
export class OnboardingModule {}
