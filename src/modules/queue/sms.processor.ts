import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SMS_PROVIDER_TOKEN } from '../providers/providers.constants';
import type { SmsProvider } from '../providers/providers.interface';

@Injectable()
export class SmsProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SmsProcessor.name);
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(SMS_PROVIDER_TOKEN) private readonly smsProvider: SmsProvider,
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => {
      void this.tick();
    }, 1000);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  private async tick() {
    const pending = await this.prisma.smsMessage.findFirst({
      where: { status: 'QUEUED' },
      orderBy: { createdAt: 'asc' },
    });

    if (!pending) {
      return;
    }

    try {
      const result = await this.smsProvider.send({ to: pending.toPhoneNumber, body: pending.body });
      await this.prisma.smsMessage.update({
        where: { id: pending.id },
        data: {
          provider: result.provider,
          providerRef: result.providerRef,
          status: 'SENT',
          sentAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Failed to process SMS ${pending.id}: ${(error as Error).message}`);
      await this.prisma.smsMessage.update({
        where: { id: pending.id },
        data: {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }
}
