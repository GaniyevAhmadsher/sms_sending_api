import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  const makeService = () => {
    const payment = {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      findMany: jest.fn(),
    };

    const webhookEvent = {
      upsert: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    };

    const prisma = {
      payment,
      webhookEvent,
      $transaction: jest.fn(async (cb: any) => cb({ payment, user: { update: jest.fn() }, transaction: { create: jest.fn() } })),
    } as any;

    const billingService = {
      applyPaymentTopupInTransaction: jest.fn(),
    } as any;

    const queueService = {
      enqueuePaymentWebhookJob: jest.fn(),
    } as any;

    const providers = [
      {
        provider: 'CLICK',
        createPayment: jest.fn(async () => ({ externalId: 'click-ext-1', paymentUrl: 'https://click/pay', params: { foo: 'bar' } })),
        verifyWebhook: jest.fn(() => ({ externalId: 'click-ext-1', amount: 100, status: 'SUCCESS', raw: {}, dedupeKey: 'd1' })),
      },
      {
        provider: 'PAYME',
        createPayment: jest.fn(async () => ({ externalId: 'payme-ext-1', paymentUrl: 'https://payme/pay', params: { foo: 'bar' } })),
        verifyWebhook: jest.fn(() => ({ externalId: 'payme-ext-1', amount: 100, status: 'SUCCESS', raw: {}, dedupeKey: 'd2' })),
      },
    ] as any;

    const metrics = { increment: jest.fn(), observe: jest.fn() } as any;
    const redis = { setNxWithExpiry: jest.fn().mockResolvedValue(true) } as any;
    const config = { webhookMaxDriftSec: 300, webhookNonceTtlSec: 600 } as any;

    const service = new PaymentsService(prisma, billingService, queueService, providers, metrics, redis, config);
    return { service, payment, webhookEvent, billingService, queueService, redis };
  };

  it('creates pending payment and returns provider URL', async () => {
    const { service, payment } = makeService();
    payment.create.mockResolvedValue({ id: 'p1', userId: 'u1', amount: 100, provider: 'CLICK', status: 'PENDING' });
    payment.update.mockResolvedValue({ id: 'p1', userId: 'u1', amount: 100, provider: 'CLICK', status: 'PENDING', externalId: 'click-ext-1' });

    const result = await service.create('u1', 100, 'click');

    expect(result.status).toBe('PENDING');
    expect(result.externalId).toBe('click-ext-1');
  });

  it('handles duplicate webhook idempotently', async () => {
    const { service, webhookEvent } = makeService();
    webhookEvent.upsert.mockResolvedValue({ id: 'evt1', status: 'PROCESSED' });

    const now = Math.floor(Date.now() / 1000);
    const result = await service.ingestWebhook('CLICK', { 'x-webhook-timestamp': String(now) }, {});

    expect(result.ignored).toBe(true);
  });

  it('rejects replay nonce', async () => {
    const { service, redis } = makeService();
    redis.setNxWithExpiry.mockResolvedValue(false);

    const now = Math.floor(Date.now() / 1000);
    const result = await service.ingestWebhook(
      'CLICK',
      { 'x-webhook-timestamp': String(now), 'x-webhook-nonce': 'nonce-1' },
      {},
    );

    expect(result.reason).toBe('replay_detected');
  });
});
