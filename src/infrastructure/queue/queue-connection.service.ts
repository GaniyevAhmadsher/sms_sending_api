import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class QueueConnectionService {
  private readonly logger = new Logger(QueueConnectionService.name);

  constructor(private readonly redisService: RedisService) {}

  async isHealthy() {
    return this.redisService.ping();
  }

  async publish(queue: string, payload: Record<string, unknown>) {
    const key = `queue:${queue}:events`;
    try {
      await this.redisService.incrementWithExpiry(`${key}:${Date.now()}`, 3600);
    } catch (error) {
      this.logger.warn(`Redis publish fallback (queue=${queue}): ${(error as Error).message}`);
    }
    return payload;
  }
}
