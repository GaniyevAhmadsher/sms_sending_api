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
export class ClickProvider implements PaymentProvider {
  readonly provider = 'CLICK' as const;

  constructor(private readonly config: AppConfigService) {}

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentOutput> {
    const externalId = `click-${input.paymentId}-${randomUUID()}`;
    const amount = input.amount.toFixed(2);
    const merchantId = this.config.clickMerchantId;
    const paymentUrl = `https://my.click.uz/services/pay?service_id=${encodeURIComponent(merchantId)}&merchant_trans_id=${encodeURIComponent(externalId)}&amount=${encodeURIComponent(amount)}`;

    return {
      externalId,
      paymentUrl,
      params: {
        merchantId,
        amount,
        merchantTransId: externalId,
        returnUrl: this.config.paymentReturnUrl,
      },
    };
  }

  verifyWebhook(
    headers: Record<string, string | string[] | undefined>,
    body: any,
  ): VerifiedWebhook {
    const externalId = String(body?.transaction_id ?? body?.external_id ?? '');
    const amount = Number(body?.amount);
    const eventStatus = String(body?.status ?? '').toLowerCase();
    const signTime = String(body?.sign_time ?? body?.timestamp ?? '');
    const signature = this.extractSignature(headers, body);

    if (
      !externalId ||
      !Number.isFinite(amount) ||
      !eventStatus ||
      !signTime ||
      !signature
    ) {
      throw new ForbiddenException('Invalid Click webhook payload');
    }

    const base = `${externalId}:${eventStatus}:${amount.toFixed(2)}:${signTime}`;
    const expected = createHmac('sha256', this.config.clickSecretKey)
      .update(base)
      .digest('hex');

    if (expected !== signature) {
      throw new ForbiddenException('Invalid Click signature');
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
    const headerValue = headers['x-click-signature'];
    if (typeof headerValue === 'string' && headerValue.length > 0) {
      return headerValue;
    }

    if (Array.isArray(headerValue) && headerValue[0]) {
      return headerValue[0];
    }

    return String(body?.signature ?? '');
  }
}
