import { Inject, Injectable, Logger } from '@nestjs/common';
import { SMS_PROVIDER_TOKEN } from '../providers/providers.constants';
import type { SmsProvider } from '../providers/providers.interface';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SmsProcessor {
  private readonly logger = new Logger(SmsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(SMS_PROVIDER_TOKEN) private readonly smsProvider: SmsProvider,
  ) {}

  async process(payload: { smsId: string; userId: string; to: string; body: string }) {
    try {
      const result = await this.smsProvider.send({ to: payload.to, body: payload.body });
      await this.prisma.smsMessage.update({
        where: { id: payload.smsId },
        data: {
          provider: result.provider,
          providerRef: result.providerRef,
          status: 'SENT',
          sentAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error(`Failed to process SMS ${payload.smsId}`);
      await this.prisma.smsMessage.update({
        where: { id: payload.smsId },
        data: {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }
}
