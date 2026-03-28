import { SmsQueue } from './sms.queue';

describe('SmsQueue', () => {
  it('enqueues send-sms job with retry and backoff options', async () => {
    const add = jest.fn().mockResolvedValue({ id: 'sms:s1' });
    const queue = new SmsQueue({ add } as any);

    await queue.enqueue({ smsId: 's1', userId: 'u1' });

    expect(add).toHaveBeenCalledWith(
      'send-sms',
      { smsId: 's1', userId: 'u1' },
      expect.objectContaining({
        attempts: 5,
        backoff: { type: 'exponential', delay: 3000 },
        removeOnComplete: true,
        removeOnFail: false,
        jobId: 'sms:s1',
      }),
    );
  });
});
