export type PaymentProviderName = 'CLICK' | 'PAYME';

export interface CreatePaymentInput {
  paymentId: string;
  userId: string;
  amount: number;
}

export interface CreatePaymentOutput {
  externalId: string;
  paymentUrl: string;
  params: Record<string, unknown>;
}

export interface VerifiedWebhook {
  externalId: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELED';
  amount: number;
  raw: Record<string, unknown>;
  dedupeKey: string;
  eventTimestamp: Date;
  nonce: string;
}

export interface PaymentProvider {
  readonly provider: PaymentProviderName;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentOutput>;
  verifyWebhook(
    headers: Record<string, string | string[] | undefined>,
    body: any,
  ): VerifiedWebhook;
}
