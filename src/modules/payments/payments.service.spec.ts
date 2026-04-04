import { ForbiddenException } from '@nestjs/common';
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

    const metrics = {
      webhookLatency: { labels: jest.fn(() => ({ observe: jest.fn() })) },
      paymentFailedTotal: { inc: jest.fn() },
      paymentTopupTotal: { inc: jest.fn() },
    } as any;

    const config = {
      webhookMaxDriftSeconds: 300,
      webhookNonceTtlSeconds: 900,
    } as any;

    const redis = {
      setIfNotExists: jest.fn().mockResolvedValue(true),
    } as any;

    const providers = [
      {
        provider: 'CLICK',
        createPayment: jest.fn(async () => ({ externalId: 'click-ext-1', paymentUrl: 'https://click/pay', params: { foo: 'bar' } })),
        verifyWebhook: jest.fn(() => ({
          externalId: 'click-ext-1',
          amount: 100,
          status: 'SUCCESS',
          raw: {},
          dedupeKey: 'd1',
          eventTimestamp: new Date(),
          nonce: 'n1',
        })),
      },
    ] as any;

    const service = new PaymentsService(prisma, billingService, queueService, providers, metrics, config, redis);
    return { service, payment, webhookEvent, queueService, redis, providers };
  };

  it('creates pending payment and returns provider URL', async () => {
    const { service, payment } = makeService();
    payment.create.mockResolvedValue({ id: 'p1', userId: 'u1', amount: 100, provider: 'CLICK', status: 'PENDING' });
    payment.update.mockResolvedValue({ id: 'p1', userId: 'u1', amount: 100, provider: 'CLICK', status: 'PENDING', externalId: 'click-ext-1' });

    const result = await service.create('u1', 100, 'click');

    expect(result.status).toBe('PENDING');
    expect(result.externalId).toBe('click-ext-1');
  });

  it('queues webhook for async processing', async () => {
    const { service, webhookEvent, queueService, redis } = makeService();
    webhookEvent.upsert.mockResolvedValue({ id: 'evt2', status: 'RECEIVED' });

    await service.ingestWebhook('CLICK', {}, {});

    expect(redis.setIfNotExists).toHaveBeenCalledTimes(1);
    expect(queueService.enqueuePaymentWebhookJob).toHaveBeenCalledTimes(1);
  });

  it('rejects replayed webhook nonces', async () => {
    const { service, redis } = makeService();
    redis.setIfNotExists.mockResolvedValue(false);

    await expect(service.ingestWebhook('CLICK', {}, {})).rejects.toThrow(ForbiddenException);
  });
});
