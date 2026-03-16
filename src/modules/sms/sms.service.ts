import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SendSmsDto } from './dto/send-sms.dto';
import { QueueService } from '../queue/queue.service';
import { BillingService } from '../billing/billing.service';

@Injectable()
export class SmsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
    private readonly billingService: BillingService,
  ) {}

  async send(userId: string, dto: SendSmsDto) {
    this.validatePayload(dto);

    const sms = await this.prisma.smsMessage.create({
      data: {
        userId,
        toPhoneNumber: dto.to,
        body: dto.body,
        provider: 'pending',
        status: 'QUEUED',
      },
    });

    await this.billingService.deductForSms(userId, sms.id);
    await this.queueService.enqueueSmsJob({ smsId: sms.id, userId, to: dto.to, body: dto.body });

    await this.prisma.usageLog.create({
      data: { userId, endpoint: '/sms/send', method: 'POST', metadata: { smsId: sms.id } },
    });

    return { id: sms.id, status: sms.status, to: sms.toPhoneNumber, createdAt: sms.createdAt };
  }

  private validatePayload(dto: SendSmsDto) {
    if (!dto.to || !/^\+?[1-9]\d{7,14}$/.test(dto.to)) {
      throw new BadRequestException('Invalid destination phone number');
    }
    if (!dto.body || dto.body.trim().length === 0 || dto.body.length > 1000) {
      throw new BadRequestException('Invalid message body');
    }
  }
}
