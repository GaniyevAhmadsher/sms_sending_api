import { RateLimitService } from './rate-limit.service';

describe('RateLimitService', () => {
  it('enforces limits', async () => {
    const redisService = {
      incrementWithExpiry: jest
        .fn()
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(3),
    } as any;

    const service = new RateLimitService(redisService);
    expect((await service.consume('k', 2, 60)).allowed).toBe(true);
    expect((await service.consume('k', 2, 60)).allowed).toBe(true);
    expect((await service.consume('k', 2, 60)).allowed).toBe(false);
  });
});
