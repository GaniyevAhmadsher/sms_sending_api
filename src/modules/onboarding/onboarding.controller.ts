import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ApiKeysService } from '../api-keys/api-keys.service';
import { PaymentsService } from '../payments/payments.service';
import { AnalyticsService } from '../analytics/analytics.service';

@Controller('onboarding')
@UseGuards(JwtAuthGuard)
export class OnboardingController {
  constructor(
    private readonly apiKeysService: ApiKeysService,
    private readonly paymentsService: PaymentsService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  @Post('api-keys')
  createApiKey(@CurrentUser('sub') userId: string, @Body() body: { label?: string }) {
    return this.apiKeysService.create(userId, body.label);
  }

  @Post('wallet/fund')
  fundWallet(@CurrentUser('sub') userId: string, @Body() body: { amount: number; provider: string }) {
    return this.paymentsService.create(userId, body.amount, body.provider);
  }

  @Get('usage')
  usage(@CurrentUser('sub') userId: string) {
    return this.analyticsService.getSmsStats(userId);
  }

  @Get('invoices')
  invoices(@CurrentUser('sub') userId: string) {
    return this.paymentsService.history(userId);
  }
}
