import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SendSmsDto } from './dto/send-sms.dto';
import { QueueService } from '../queue/queue.service';
import { BillingService } from '../billing/billing.service';
import type { AuthenticatedUser } from '../../common/types/authenticated-request.interface';

@Injectable()
export class SmsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
    private readonly billingService: BillingService,
  ) {}

  async send(user: AuthenticatedUser, dto: SendSmsDto) {
    this.validatePayload(dto);

    await this.billingService.ensureSufficientBalance(user.id, 1);

    const sms = await this.prisma.smsMessage.create({
      data: {
        userId: user.id,
        apiKeyId: user.apiKeyId,
        toPhoneNumber: dto.to,
        body: dto.body,
        provider: process.env.SMS_PROVIDER ?? 'mock',
        status: 'PENDING',
      },
    });

    await this.billingService.deductForSms(user.id, sms.id);
    await this.queueService.enqueueSmsJob({ smsId: sms.id });

    await this.prisma.usageLog.create({
      data: {
        userId: user.id,
        apiKeyId: user.apiKeyId,
        endpoint: '/sms/send',
        method: 'POST',
        statusCode: 202,
        metadata: { smsId: sms.id },
      },
    });

    return {
      id: sms.id,
      status: 'QUEUED',
      to: sms.toPhoneNumber,
      createdAt: sms.createdAt,
    };
  }

  async getStatus(userId: string, smsId: string) {
    const sms = await this.prisma.smsMessage.findFirst({
      where: { id: smsId, userId },
      select: {
        id: true,
        status: true,
        errorMessage: true,
        provider: true,
        providerRef: true,
        createdAt: true,
        queuedAt: true,
        sentAt: true,
        deliveredAt: true,
      },
    });

    if (!sms) {
      throw new NotFoundException('SMS not found');
    }

    return sms;
  }

  async markDelivered(userId: string, smsId: string) {
    const sms = await this.prisma.smsMessage.findFirst({ where: { id: smsId, userId } });
    if (!sms) {
      throw new NotFoundException('SMS not found');
    }

    return this.prisma.smsMessage.update({
      where: { id: smsId },
      data: { status: 'DELIVERED', deliveredAt: new Date() },
      select: { id: true, status: true, deliveredAt: true },
    });
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
