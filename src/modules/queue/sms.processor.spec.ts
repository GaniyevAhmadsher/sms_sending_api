import { SmsProcessor } from './sms.processor';

describe('SmsProcessor', () => {
  it('requeues failed sms job with retry metadata', async () => {
    const prisma = { smsMessage: { update: jest.fn() } } as any;
    const redis = { lpop: jest.fn(), rpush: jest.fn() } as any;
    const provider = { send: jest.fn().mockRejectedValue(new Error('provider down')) } as any;

    redis.lpop.mockResolvedValue(
      JSON.stringify({ smsId: 's1', userId: 'u1', to: '+12345678901', body: 'hello', attempt: 1 }),
    );

    const processor = new SmsProcessor(prisma, redis, provider);
    await (processor as any).pollOnce();

    expect(redis.rpush).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(redis.rpush.mock.calls[0][1]);
    expect(payload.attempt).toBe(2);
  });
});
