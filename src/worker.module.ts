import { Module } from '@nestjs/common';
import { PrismaModule } from './database/prisma.module';
import { ConfigModule } from './infrastructure/config/config.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { QueueModule } from './modules/queue/queue.module';
import { PinoLoggerService } from './infrastructure/logging/pino-logger.service';
import { MetricsModule } from './infrastructure/metrics/metrics.module';

@Module({
  imports: [ConfigModule, PrismaModule, RedisModule, MetricsModule, QueueModule],
  providers: [PinoLoggerService],
})
export class WorkerModule {}
