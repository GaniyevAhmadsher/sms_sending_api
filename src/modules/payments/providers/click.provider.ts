import { ForbiddenException, Injectable } from '@nestjs/common';
import { createHmac, randomUUID, timingSafeEqual } from 'crypto';
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

  verifyWebhook(headers: Record<string, string | string[] | undefined>, body: any): VerifiedWebhook {
    const externalId = String(body?.transaction_id ?? body?.external_id ?? '');
    const amount = Number(body?.amount);
    const eventStatus = String(body?.status ?? '').toLowerCase();
    const signTime = String(body?.sign_time ?? body?.timestamp ?? '');
    const signature = this.extractSignature(headers, body);

    if (!externalId || !Number.isFinite(amount) || !eventStatus || !signTime || !signature) {
      throw new ForbiddenException('Invalid Click webhook payload');
    }

    const base = `${externalId}:${eventStatus}:${amount.toFixed(2)}:${signTime}`;
    const expected = createHmac('sha256', this.config.clickSecretKey).update(base).digest('hex');
    this.assertSignature(expected, signature);

    const eventTimestamp = this.parseTimestamp(signTime);

    return {
      externalId,
      amount,
      status: this.mapStatus(eventStatus),
      raw: body as Record<string, unknown>,
      dedupeKey: `click:${externalId}:${eventStatus}:${signTime}`,
      eventTimestamp,
      nonce: `${externalId}:${signTime}`,
    };
  }

  private mapStatus(status: string): VerifiedWebhook['status'] {
    if (status === 'success' || status === 'paid') return 'SUCCESS';
    if (status === 'pending' || status === 'created') return 'PENDING';
    if (status === 'canceled' || status === 'cancelled') return 'CANCELED';
    return 'FAILED';
  }

  private assertSignature(expected: string, received: string) {
    const expectedBuffer = Buffer.from(expected);
    const receivedBuffer = Buffer.from(received);
    if (expectedBuffer.length !== receivedBuffer.length || !timingSafeEqual(expectedBuffer, receivedBuffer)) {
      throw new ForbiddenException('Invalid Click signature');
    }
  }

  private parseTimestamp(raw: string): Date {
    const numeric = Number(raw);
    if (Number.isFinite(numeric)) {
      return new Date(numeric > 10_000_000_000 ? numeric : numeric * 1000);
    }

    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) {
      throw new ForbiddenException('Invalid webhook timestamp');
    }

    return parsed;
  }

  private extractSignature(headers: Record<string, string | string[] | undefined>, body: any): string {
    const headerValue = headers['x-click-signature'];
    if (typeof headerValue === 'string' && headerValue.length > 0) return headerValue;
    if (Array.isArray(headerValue) && headerValue[0]) return headerValue[0];
    return String(body?.signature ?? '');
  }
}
