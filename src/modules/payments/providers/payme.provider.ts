import { ForbiddenException, Injectable } from '@nestjs/common';
import { createHmac, randomUUID } from 'crypto';
import { AppConfigService } from '../../../infrastructure/config/app-config.service';
import {
  CreatePaymentInput,
  CreatePaymentOutput,
  PaymentProvider,
  VerifiedWebhook,
} from './payment-provider.interface';

@Injectable()
export class PaymeProvider implements PaymentProvider {
  readonly provider = 'PAYME' as const;

  constructor(private readonly config: AppConfigService) {}

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentOutput> {
    const externalId = `payme-${input.paymentId}-${randomUUID()}`;
    const amount = Number((input.amount * 100).toFixed(0));
    const paymentUrl = `https://checkout.paycom.uz/${encodeURIComponent(this.config.paymeMerchantId)}?payment=${encodeURIComponent(externalId)}&amount=${amount}`;

    return {
      externalId,
      paymentUrl,
      params: {
        merchantId: this.config.paymeMerchantId,
        amount,
        account: {
          userId: input.userId,
          paymentId: input.paymentId,
        },
        callbackUrl: this.config.paymentReturnUrl,
      },
    };
  }

  verifyWebhook(
    headers: Record<string, string | string[] | undefined>,
    body: any,
  ): VerifiedWebhook {
    const externalId = String(
      body?.external_id ?? body?.id ?? body?.params?.id ?? '',
    );
    const amount = Number(body?.amount);
    const eventStatus = String(body?.status ?? '').toLowerCase();
    const timestamp = String(body?.timestamp ?? body?.time ?? '');
    const signature = this.extractSignature(headers, body);

    if (
      !externalId ||
      !Number.isFinite(amount) ||
      !eventStatus ||
      !timestamp ||
      !signature
    ) {
      throw new ForbiddenException('Invalid Payme webhook payload');
    }

    const base = `${externalId}:${amount}:${eventStatus}:${timestamp}`;
    const expected = createHmac('sha256', this.config.paymeSecretKey)
      .update(base)
      .digest('hex');

    if (expected !== signature) {
      throw new ForbiddenException('Invalid Payme signature');
    }

    return {
      externalId,
      amount,
      status:
        eventStatus === 'success' || eventStatus === 'paid'
          ? 'SUCCESS'
          : 'FAILED',
      raw: body as Record<string, unknown>,
    };
  }

  private extractSignature(
    headers: Record<string, string | string[] | undefined>,
    body: any,
  ): string {
    const headerValue = headers['x-payme-signature'];
    if (typeof headerValue === 'string' && headerValue.length > 0) {
      return headerValue;
    }

    if (Array.isArray(headerValue) && headerValue[0]) {
      return headerValue[0];
    }

    return String(body?.signature ?? '');
  }
}
