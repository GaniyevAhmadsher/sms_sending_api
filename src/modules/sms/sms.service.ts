import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { BillingService } from '../billing/billing.service';
import { QueueService } from '../queue/queue.service';
import { SendSmsDto } from './dto/send-sms.dto';
import { MetricsService } from '../../infrastructure/metrics/metrics.service';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
    private readonly billingService: BillingService,
    private readonly metrics: MetricsService,
  ) {}

  async send(userId: string, dto: SendSmsDto, apiKeyId?: string) {
    this.validatePayload(dto);
    this.metrics.smsSendTotal.inc();
    const existing = dto.idempotencyKey
      ? await this.prisma.smsMessage.findUnique({
          where: {
            userId_idempotencyKey: {
              userId,
              idempotencyKey: dto.idempotencyKey,
            },
          },
        })
      : null;

    if (existing) {
      this.metrics.smsSendTotal.labels().inc();
      return {
        id: existing.id,
        status: existing.status,
        to: existing.toPhoneNumber,
        createdAt: existing.createdAt,
        idempotentReplay: true,
      };
    }

    const sms = await this.prisma.$transaction(async (tx) => {
      const created = await tx.smsMessage.create({
        data: {
          userId,
          apiKeyId,
          idempotencyKey: dto.idempotencyKey,
          toPhoneNumber: dto.to,
          body: dto.body,
          provider: 'pending',
          status: 'PENDING',
          cost: 1
        },
      });

      await this.billingService.chargeSmsInTransaction(tx, userId, created.id, 1);

      return created;
    });

    this.metrics.smsSendTotal.labels().inc();

    try {
      await this.queueService.enqueueSmsJob({
        smsId: sms.id,
        userId,
      });

      await this.prisma.smsMessage.update({
        where: { id: sms.id },
        data: { status: 'QUEUED', queuedAt: new Date() },
      });
    } catch (error) {
      this.logger.error(`Failed queue enqueue for SMS ${sms.id}`);
      this.metrics.smsFailedTotal.inc();
      await this.prisma.smsMessage.update({
        where: { id: sms.id },
        data: {
          status: 'FAILED',
          errorMessage: 'Queue enqueue failed',
        },
      });
      throw new ServiceUnavailableException('SMS queue unavailable; message was not scheduled');
    }

    await this.prisma.usageLog.create({
      data: {
        userId,
        apiKeyId,
        endpoint: '/sms/send',
        method: 'POST',
        statusCode: 202,
        metadata: { smsId: sms.id },
      },
    });

    return { id: sms.id, status: 'QUEUED', to: sms.toPhoneNumber, createdAt: sms.createdAt };
  }

  private validatePayload(dto: SendSmsDto) {
    if (!dto.to || !/^\+?[1-9]\d{7,14}$/.test(dto.to)) {
      throw new BadRequestException('Invalid destination phone number');
    }

    if (!dto.body || dto.body.trim().length === 0 || dto.body.length > 1000) {
      throw new BadRequestException('Invalid message body');
    }

    if (dto.idempotencyKey && !/^[a-zA-Z0-9:_-]{8,100}$/.test(dto.idempotencyKey)) {
      throw new BadRequestException('Invalid idempotency key');
    }
  }
}
