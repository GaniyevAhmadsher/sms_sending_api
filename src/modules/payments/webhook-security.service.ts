import { ForbiddenException, Injectable } from '@nestjs/common';
import { RedisService } from '../../infrastructure/redis/redis.service';
import { AppConfigService } from '../../infrastructure/config/app-config.service';

@Injectable()
export class WebhookSecurityService {
  constructor(
    private readonly redis: RedisService,
    private readonly config: AppConfigService,
  ) {}

  async assertFreshAndUnique(provider: string, timestampRaw: string, nonce: string) {
    const timestamp = Number(timestampRaw);
    if (!Number.isFinite(timestamp)) throw new ForbiddenException('Missing webhook timestamp');

    const unixSeconds = timestamp > 2_000_000_000 ? Math.floor(timestamp / 1000) : Math.floor(timestamp);
    const drift = Math.abs(Math.floor(Date.now() / 1000) - unixSeconds);
    if (drift > this.config.webhookMaxDriftSeconds) {
      throw new ForbiddenException('Webhook timestamp drift exceeded');
    }

    const key = `webhook:nonce:${provider}:${nonce}`;
    const seen = await this.redis.incrementWithExpiry(key, this.config.webhookNonceTtlSeconds);
    if (seen > 1) throw new ForbiddenException('Webhook replay detected');
  }
}
