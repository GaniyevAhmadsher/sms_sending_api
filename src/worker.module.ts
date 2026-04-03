import { Module } from '@nestjs/common';
import { PrismaModule } from './database/prisma.module';
import { ConfigModule } from './infrastructure/config/config.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { QueueModule } from './modules/queue/queue.module';
import { ObservabilityModule } from './infrastructure/observability/observability.module';

@Module({
  imports: [ConfigModule, PrismaModule, RedisModule, QueueModule, ObservabilityModule],
})
export class WorkerModule {}
