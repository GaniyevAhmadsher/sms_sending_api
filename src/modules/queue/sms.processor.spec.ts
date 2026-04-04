import { SmsProcessor } from './sms.processor';

describe('SmsProcessor', () => {
  const metrics = {
    providerLatency: { observe: jest.fn() },
    smsSuccessTotal: { inc: jest.fn() },
    smsFailedTotal: { inc: jest.fn(), labels: jest.fn().mockReturnValue({ inc: jest.fn() }) },
    queueRetryTotal: { inc: jest.fn() },
    dlqSize: { set: jest.fn() },
  } as any;

  it('marks SMS as FAILED and writes to dlq on final failure', async () => {
    const prisma = {
      smsMessage: {
        update: jest.fn(),
      },
    } as any;
    const connection = { rpush: jest.fn().mockResolvedValue(1), llen: jest.fn().mockResolvedValue(1) } as any;
    const provider = { send: jest.fn() } as any;

    const processor = new SmsProcessor(prisma, connection, provider, metrics);

    await processor.onJobFailed(
      {
        id: 'sms:s1',
        data: { smsId: 's1', userId: 'u1' },
        attemptsMade: 5,
        opts: { attempts: 5 },
      },
      new Error('provider down'),
    );

    expect(prisma.smsMessage.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 's1' },
        data: expect.objectContaining({ status: 'FAILED', errorMessage: 'provider down' }),
      }),
    );
    expect(connection.rpush).toHaveBeenCalledTimes(1);
  });

  it('does not send duplicate SMS if status is already SENT', async () => {
    const prisma = {
      smsMessage: {
        findUnique: jest.fn().mockResolvedValue({
          id: 's1',
          status: 'SENT',
          toPhoneNumber: '+12345678901',
          body: 'hello',
        }),
        update: jest.fn(),
      },
    } as any;
    const connection = { rpush: jest.fn(), llen: jest.fn() } as any;
    const provider = { send: jest.fn() } as any;

    const processor = new SmsProcessor(prisma, connection, provider, metrics);
    const result = await processor.processSendSms({
      id: 'sms:s1',
      data: { smsId: 's1', userId: 'u1' },
      attemptsMade: 1,
      opts: { attempts: 5 },
    });

    expect(result).toEqual({ skipped: true });
    expect(provider.send).not.toHaveBeenCalled();
    expect(prisma.smsMessage.update).not.toHaveBeenCalled();
  });

  it('throws provider errors so BullMQ can retry with backoff', async () => {
    const prisma = {
      smsMessage: {
        findUnique: jest.fn().mockResolvedValue({
          id: 's1',
          status: 'QUEUED',
          toPhoneNumber: '+12345678901',
          body: 'hello',
        }),
        update: jest.fn(),
      },
    } as any;
    const connection = { rpush: jest.fn(), llen: jest.fn() } as any;
    const provider = { send: jest.fn().mockRejectedValue(new Error('temporary outage')) } as any;

    const processor = new SmsProcessor(prisma, connection, provider, metrics);

    await expect(
      processor.processSendSms({
        id: 'sms:s1',
        data: { smsId: 's1', userId: 'u1' },
        attemptsMade: 1,
        opts: { attempts: 5 },
      }),
    ).rejects.toThrow('temporary outage');
  });
});
