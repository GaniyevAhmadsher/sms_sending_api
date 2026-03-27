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
  status: 'SUCCESS' | 'FAILED';
  amount: number;
  raw: Record<string, unknown>;
}

export interface PaymentProvider {
  readonly provider: PaymentProviderName;
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentOutput>;
  verifyWebhook(
    headers: Record<string, string | string[] | undefined>,
    body: any,
  ): VerifiedWebhook;
}
