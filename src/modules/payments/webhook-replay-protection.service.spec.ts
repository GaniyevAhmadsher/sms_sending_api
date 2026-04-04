import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AppConfigService } from '../../infrastructure/config/app-config.service';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { WebhookReplayProtectionService } from './webhook-replay-protection.service';

describe('WebhookReplayProtectionService', () => {
  let service: WebhookReplayProtectionService;
  let redis: { setIfNotExistsWithExpiry: jest.Mock };

  beforeEach(() => {
    redis = { setIfNotExistsWithExpiry: jest.fn().mockResolvedValue(true) };
    const config = {
      webhookMaxDriftSeconds: 300,
      webhookNonceTtlSeconds: 900,
    } as unknown as AppConfigService;

    service = new WebhookReplayProtectionService(config, redis as unknown as RedisService);
  });

  it('throws when timestamp header is missing', async () => {
    await expect(service.validate('CLICK', {}, {})).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws when nonce already exists', async () => {
    redis.setIfNotExistsWithExpiry.mockResolvedValue(false);
    await expect(
      service.validate(
        'CLICK',
        {
          'x-webhook-timestamp': String(Math.floor(Date.now() / 1000)),
          'x-webhook-nonce': 'same-nonce',
        },
        {},
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
