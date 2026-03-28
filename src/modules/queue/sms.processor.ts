import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SMS_PROVIDER_TOKEN } from '../providers/providers.constants';
import type { SmsProvider } from '../providers/providers.interface';
import { BULLMQ_CONNECTION, SMS_DLQ, SMS_QUEUE } from './queue.constants';
import type { SmsJobPayload } from './sms.queue';

interface SmsJob {
  id?: string;
  data: SmsJobPayload;
  attemptsMade: number;
  opts: { attempts?: number };
  name?: string;
}

interface SmsWorker {
  on: (event: string, handler: (...args: any[]) => void) => void;
  waitUntilReady: () => Promise<void>;
  close: () => Promise<void>;
}

interface SmsQueueEvents {
  close: () => Promise<void>;
}

@Injectable()
export class SmsProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SmsProcessor.name);
  private worker?: SmsWorker;
  private queueEvents?: SmsQueueEvents;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(BULLMQ_CONNECTION) private readonly connection: any,
    @Inject(SMS_PROVIDER_TOKEN) private readonly smsProvider: SmsProvider,
  ) {}

  async onModuleInit() {
    if (process.env.QUEUE_WORKER_ENABLED !== 'true') {
      this.logger.log('QUEUE_WORKER_ENABLED is not true, SMS worker will not start in this process');
      return;
    }

    const { Worker, QueueEvents } = await import('bullmq');

    const worker = new Worker(
      SMS_QUEUE,
      async (job: SmsJob) => this.processSendSms(job),
      {
        connection: this.connection,
        concurrency: 10,
      },
    );

    this.worker = worker;

    this.queueEvents = new QueueEvents(SMS_QUEUE, {
      connection: this.connection,
    });

    worker.on('active', (job: SmsJob) => {
      this.logger.log(`job started id=${job.id} name=${job.name}`);
    });

    worker.on('completed', (job: SmsJob) => {
      this.logger.log(`job completed id=${job.id} name=${job.name}`);
    });

    worker.on('failed', (job: SmsJob | undefined, error: Error) => {
      void this.onJobFailed(job, error);
    });

    await worker.waitUntilReady();
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.close();
    }
    if (this.queueEvents) {
      await this.queueEvents.close();
    }
  }

  async processSendSms(job: SmsJob) {
    const payload = job.data;
    const sms = await this.prisma.smsMessage.findUnique({ where: { id: payload.smsId } });

    if (!sms) {
      throw new Error(`SMS ${payload.smsId} not found`);
    }

    if (sms.status === 'SENT') {
      this.logger.warn(`Skipping already sent SMS ${payload.smsId}`);
      return { skipped: true };
    }

    if (sms.status === 'PENDING') {
      await this.prisma.smsMessage.update({
        where: { id: sms.id },
        data: { status: 'QUEUED', queuedAt: sms.queuedAt ?? new Date() },
      });
    }

    const result = await this.smsProvider.send({
      to: sms.toPhoneNumber,
      body: sms.body,
    });

    await this.prisma.smsMessage.update({
      where: { id: payload.smsId },
      data: {
        provider: result.provider,
        providerRef: result.providerRef,
        status: 'SENT',
        sentAt: new Date(),
        errorMessage: null,
      },
    });

    return { sent: true };
  }

  async onJobFailed(job: SmsJob | undefined, error: Error) {
    if (!job) return;

    const attempts = typeof job.opts.attempts === 'number' ? job.opts.attempts : 1;
    const attemptsMade = job.attemptsMade;
    this.logger.error(`job failed id=${job.id} attempt=${attemptsMade}/${attempts} error=${error.message}`);

    if (attemptsMade >= attempts) {
      await this.prisma.smsMessage.update({
        where: { id: job.data.smsId },
        data: {
          status: 'FAILED',
          errorMessage: error.message,
        },
      });

      await this.connection.rpush(
        SMS_DLQ,
        JSON.stringify({
          ...job.data,
          jobId: job.id,
          finalError: error.message,
          failedAt: new Date().toISOString(),
        }),
      );
    }
  }
}
