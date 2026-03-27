import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { BillingService } from '../billing/billing.service';
import { PAYMENT_PROVIDERS } from './providers/payment.constants';
import type {
  PaymentProvider,
  PaymentProviderName,
  VerifiedWebhook,
} from './providers/payment-provider.interface';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly billingService: BillingService,
    @Inject(PAYMENT_PROVIDERS) providers: PaymentProvider[],
  ) {
    this.providers = providers;
  }

  private readonly providers: PaymentProvider[];

  async create(userId: string, amount: number, providerRaw: string) {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    const provider = this.normalizeProvider(providerRaw);
    const payment = await this.prisma.payment.create({
      data: {
        userId,
        amount,
        provider,
        status: 'PENDING',
      },
    });

    const providerImpl = this.getProvider(provider);
    const creation = await providerImpl.createPayment({
      paymentId: payment.id,
      userId,
      amount,
    });

    const updated = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        externalId: creation.externalId,
      },
    });

    return {
      id: updated.id,
      amount: Number(updated.amount),
      provider: updated.provider,
      status: updated.status,
      externalId: updated.externalId,
      paymentUrl: creation.paymentUrl,
      params: creation.params,
    };
  }

  async handleClickWebhook(
    headers: Record<string, string | string[] | undefined>,
    body: any,
  ) {
    const provider = this.getProvider('CLICK');
    const payload = provider.verifyWebhook(headers, body);
    return this.processVerifiedWebhook('CLICK', payload);
  }

  async handlePaymeWebhook(
    headers: Record<string, string | string[] | undefined>,
    body: any,
  ) {
    const provider = this.getProvider('PAYME');
    const payload = provider.verifyWebhook(headers, body);
    return this.processVerifiedWebhook('PAYME', payload);
  }

  async history(userId: string) {
    const records = await this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return records.map((item: any) => ({
      ...item,
      amount: Number(item.amount),
    }));
  }

  private async processVerifiedWebhook(
    provider: PaymentProviderName,
    payload: VerifiedWebhook,
  ) {
    const result = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { externalId: payload.externalId },
      });

      if (!payment) {
        this.logger.warn(
          `[${provider}] payment not found for externalId=${payload.externalId}`,
        );
        return { accepted: true, ignored: true, reason: 'not_found' };
      }

      if (payment.provider !== provider) {
        this.logger.warn(
          `[${provider}] provider mismatch for payment=${payment.id}, actual=${payment.provider}`,
        );
        return { accepted: true, ignored: true, reason: 'provider_mismatch' };
      }

      if (payment.status !== 'PENDING') {
        return {
          accepted: true,
          ignored: true,
          reason: 'already_processed',
          status: payment.status,
        };
      }

      if (payload.status === 'FAILED') {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: 'FAILED' },
        });

        return { accepted: true, ignored: false, status: 'FAILED' };
      }

      const amount = Number(payment.amount);
      if (Math.abs(payload.amount - amount) > 0.0001) {
        this.logger.error(
          `[${provider}] amount mismatch for payment=${payment.id}: payload=${payload.amount}, payment=${amount}`,
        );

        await tx.payment.update({
          where: { id: payment.id },
          data: { status: 'FAILED' },
        });

        return {
          accepted: true,
          ignored: false,
          status: 'FAILED',
          reason: 'amount_mismatch',
        };
      }

      const updated = await tx.payment.updateMany({
        where: {
          id: payment.id,
          status: 'PENDING',
        },
        data: {
          status: 'SUCCESS',
        },
      });

      if (updated.count !== 1) {
        return { accepted: true, ignored: true, reason: 'concurrency_guard' };
      }

      await this.billingService.applyPaymentTopupInTransaction(
        tx,
        payment.userId,
        payment.id,
        provider,
        amount,
      );

      return { accepted: true, ignored: false, status: 'SUCCESS' };
    });

    return result;
  }

  private getProvider(provider: PaymentProviderName): PaymentProvider {
    const found = this.providers.find((item) => item.provider === provider);
    if (!found) {
      throw new BadRequestException(
        `Unsupported payment provider: ${provider}`,
      );
    }

    return found;
  }

  private normalizeProvider(providerRaw: string): PaymentProviderName {
    const provider = providerRaw?.toUpperCase();
    if (provider === 'CLICK' || provider === 'PAYME') {
      return provider;
    }

    throw new BadRequestException('Provider must be click or payme');
  }
}
