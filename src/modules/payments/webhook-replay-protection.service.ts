import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';
import { AppConfigService } from '../../infrastructure/config/app-config.service';
import { RedisService } from '../../infrastructure/redis/redis.service';

@Injectable()
export class WebhookReplayProtectionService {
  constructor(
    private readonly config: AppConfigService,
    private readonly redis: RedisService,
  ) {}

  async validate(provider: string, headers: Record<string, string | string[] | undefined>, body: unknown): Promise<void> {
    const timestampRaw = this.header(headers, 'x-webhook-timestamp');
    if (!timestampRaw) {
      throw new BadRequestException('Missing x-webhook-timestamp header');
    }

    const timestamp = Number(timestampRaw);
    if (!Number.isFinite(timestamp)) {
      throw new BadRequestException('Invalid x-webhook-timestamp header');
    }

    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > this.config.webhookMaxDriftSeconds) {
      throw new UnauthorizedException('Webhook timestamp drift exceeded');
    }

    const nonce = this.header(headers, 'x-webhook-nonce') ?? this.fingerprint(provider, timestamp, body);
    const nonceKey = `webhook:nonce:${provider}:${nonce}`;
    const isFirstSeen = await this.redis.setIfNotExistsWithExpiry(nonceKey, '1', this.config.webhookNonceTtlSeconds);
    if (!isFirstSeen) {
      throw new UnauthorizedException('Webhook replay detected');
    }
  }

  private fingerprint(provider: string, timestamp: number, body: unknown): string {
    const hash = createHash('sha256');
    hash.update(`${provider}:${timestamp}:`);
    hash.update(JSON.stringify(body ?? {}));
    return hash.digest('hex');
  }

  private header(headers: Record<string, string | string[] | undefined>, key: string): string | undefined {
    const value = headers[key] ?? headers[key.toLowerCase()];
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  }
}
