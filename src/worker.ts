import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';

async function bootstrapWorker() {
  process.env.QUEUE_WORKER_ENABLED = 'true';

  const app = await NestFactory.createApplicationContext(WorkerModule, {
    bufferLogs: true,
  });
  app.useLogger(['error', 'warn', 'log']);

  const logger = new Logger('WorkerBootstrap');
  logger.log('BullMQ worker is running');

  const shutdown = async () => {
    logger.warn('Shutting down worker');
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown());
  process.on('SIGTERM', () => void shutdown());
}

void bootstrapWorker();
