import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class RateLimitService {
  constructor(private readonly redisService: RedisService) {}

  async consume(key: string, limit: number, windowSeconds: number) {
    try {
      const count = await this.redisService.incrementWithExpiry(key, windowSeconds);
      return { allowed: count <= limit, count, limit };
    } catch {
      // fail-open for infrastructure outage to avoid dropping all traffic
      return { allowed: true, count: 0, limit };
    }
  }
}
