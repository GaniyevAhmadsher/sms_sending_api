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

    const prisma = {
      payment,
      $transaction: jest.fn(async (cb: any) =>
        cb({ payment, user: {}, transaction: {} }),
      ),
    } as any;

    const billingService = {
      applyPaymentTopupInTransaction: jest.fn(),
    } as any;

    const providers = [
      {
        provider: 'CLICK',
        createPayment: jest.fn(async () => ({
          externalId: 'click-ext-1',
          paymentUrl: 'https://click/pay',
          params: { foo: 'bar' },
        })),
        verifyWebhook: jest.fn(() => ({
          externalId: 'click-ext-1',
          amount: 100,
          status: 'SUCCESS',
          raw: {},
        })),
      },
      {
        provider: 'PAYME',
        createPayment: jest.fn(async () => ({
          externalId: 'payme-ext-1',
          paymentUrl: 'https://payme/pay',
          params: { foo: 'bar' },
        })),
        verifyWebhook: jest.fn(() => ({
          externalId: 'payme-ext-1',
          amount: 100,
          status: 'SUCCESS',
          raw: {},
        })),
      },
    ] as any;

    const service = new PaymentsService(prisma, billingService, providers);
    return { service, prisma, billingService, providers, payment };
  };

  it('creates pending payment and returns provider payment URL', async () => {
    const { service, payment } = makeService();
    payment.create.mockResolvedValue({
      id: 'p1',
      userId: 'u1',
      amount: 100,
      provider: 'CLICK',
      status: 'PENDING',
    });
    payment.update.mockResolvedValue({
      id: 'p1',
      userId: 'u1',
      amount: 100,
      provider: 'CLICK',
      status: 'PENDING',
      externalId: 'click-ext-1',
    });

    const result = await service.create('u1', 100, 'click');

    expect(result.status).toBe('PENDING');
    expect(result.externalId).toBe('click-ext-1');
    expect(result.paymentUrl).toContain('click');
  });

  it('ignores duplicated webhook when payment already processed', async () => {
    const { service, payment, billingService } = makeService();
    payment.findUnique.mockResolvedValue({
      id: 'p1',
      userId: 'u1',
      amount: 100,
      provider: 'CLICK',
      status: 'SUCCESS',
      externalId: 'click-ext-1',
    });

    const result = await service.handleClickWebhook({}, {});

    expect(result.ignored).toBe(true);
    expect(result.reason).toBe('already_processed');
    expect(
      billingService.applyPaymentTopupInTransaction,
    ).not.toHaveBeenCalled();
  });

  it('processes successful webhook atomically and tops up once', async () => {
    const { service, payment, billingService } = makeService();
    payment.findUnique.mockResolvedValue({
      id: 'p1',
      userId: 'u1',
      amount: 100,
      provider: 'CLICK',
      status: 'PENDING',
      externalId: 'click-ext-1',
    });
    payment.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.handleClickWebhook({}, {});

    expect(result.status).toBe('SUCCESS');
    expect(billingService.applyPaymentTopupInTransaction).toHaveBeenCalledTimes(
      1,
    );
  });
});
