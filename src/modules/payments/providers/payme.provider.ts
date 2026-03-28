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

  verifyWebhook(headers: Record<string, string | string[] | undefined>, body: any): VerifiedWebhook {
    const externalId = String(body?.external_id ?? body?.id ?? body?.params?.id ?? '');
    const amount = Number(body?.amount);
    const eventStatus = String(body?.status ?? '').toLowerCase();
    const timestamp = String(body?.timestamp ?? body?.time ?? '');
    const signature = this.extractSignature(headers, body);

    if (!externalId || !Number.isFinite(amount) || !eventStatus || !timestamp || !signature) {
      throw new ForbiddenException('Invalid Payme webhook payload');
    }

    const base = `${externalId}:${amount}:${eventStatus}:${timestamp}`;
    const expected = createHmac('sha256', this.config.paymeSecretKey).update(base).digest('hex');
    this.assertSignature(expected, signature);

    return {
      externalId,
      amount,
      status: this.mapStatus(eventStatus),
      raw: body as Record<string, unknown>,
      dedupeKey: `payme:${externalId}:${eventStatus}:${timestamp}`,
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
      throw new ForbiddenException('Invalid Payme signature');
    }
  }

  private extractSignature(headers: Record<string, string | string[] | undefined>, body: any): string {
    const headerValue = headers['x-payme-signature'];
    if (typeof headerValue === 'string' && headerValue.length > 0) return headerValue;
    if (Array.isArray(headerValue) && headerValue[0]) return headerValue[0];
    return String(body?.signature ?? '');
  }
}
