import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../database/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiKeysService } from '../api-keys/api-keys.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { PaymentsService } from '../payments/payments.service';

@Controller('onboarding')
@UseGuards(JwtAuthGuard)
export class OnboardingController {
  constructor(
    private readonly apiKeysService: ApiKeysService,
    private readonly paymentsService: PaymentsService,
    private readonly analyticsService: AnalyticsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('tenant')
  createTenant(@CurrentUser('sub') userId: string, @Body() body: { companyName?: string }) {
    return {
      tenantId: userId,
      companyName: body.companyName ?? 'default-tenant',
      mode: 'single-tenant-by-user',
    };
  }

  @Post('workspace')
  createWorkspace(@CurrentUser('sub') userId: string, @Body() body: { name?: string }) {
    return { workspaceId: `${userId}:${body.name ?? 'default'}`, ownerUserId: userId };
  }

  @Post('api-keys')
  createApiKey(@CurrentUser('sub') userId: string, @Body() body: { label?: string; rateLimitRpm?: number }) {
    return this.apiKeysService.create(userId, body.label, body.rateLimitRpm);
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

  @Get('delivery-report')
  async deliveryReport(@CurrentUser('sub') userId: string) {
    return this.prisma.smsMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: { id: true, status: true, toPhoneNumber: true, provider: true, createdAt: true, sentAt: true, deliveredAt: true },
    });
  }

  @Post('sender-ids')
  registerSenderId(@CurrentUser('sub') userId: string, @Body() body: { senderId: string; country?: string }) {
    return {
      id: `${userId}:${body.senderId}`,
      senderId: body.senderId,
      country: body.country ?? 'GLOBAL',
      status: 'PENDING_APPROVAL',
    };
  }

  @Post('webhook-callbacks')
  registerCallback(
    @CurrentUser('sub') userId: string,
    @Body() body: { url: string; events: string[]; callbackSecret?: string },
  ) {
    const callbackSecret = body.callbackSecret ?? `cb_${Math.random().toString(36).slice(2, 18)}`;
    return {
      tenantId: userId,
      url: body.url,
      events: body.events,
      callbackSecret,
      signatureHeader: 'x-callback-signature',
    };
  }

  @Get('webhook-callbacks/:callbackId')
  getCallbackSecret(@CurrentUser('sub') userId: string, @Param('callbackId') callbackId: string) {
    return {
      callbackId,
      tenantId: userId,
      callbackSecretRotationSupported: true,
      signatureHeader: 'x-callback-signature',
    };
  }
}
