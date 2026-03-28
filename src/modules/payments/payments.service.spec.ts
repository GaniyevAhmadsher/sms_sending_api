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

    const service = new PaymentsService(prisma, billingService, queueService, providers);
    return { service, payment, webhookEvent, billingService, queueService };
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

    const result = await service.ingestWebhook('CLICK', {}, {});

    expect(result.ignored).toBe(true);
  });

  it('queues webhook for async processing', async () => {
    const { service, webhookEvent, queueService } = makeService();
    webhookEvent.upsert.mockResolvedValue({ id: 'evt2', status: 'RECEIVED' });

    await service.ingestWebhook('CLICK', {}, {});

    expect(queueService.enqueuePaymentWebhookJob).toHaveBeenCalledTimes(1);
    expect(webhookEvent.update).toHaveBeenCalledTimes(1);
  });
});
