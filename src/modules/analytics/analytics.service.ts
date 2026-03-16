import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSmsStats(userId: string) {
    const [total, pending, queued, sent, failed, delivered] = await Promise.all([
      this.prisma.smsMessage.count({ where: { userId } }),
      this.prisma.smsMessage.count({ where: { userId, status: 'PENDING' } }),
      this.prisma.smsMessage.count({ where: { userId, status: 'QUEUED' } }),
      this.prisma.smsMessage.count({ where: { userId, status: 'SENT' } }),
      this.prisma.smsMessage.count({ where: { userId, status: 'FAILED' } }),
      this.prisma.smsMessage.count({ where: { userId, status: 'DELIVERED' } }),
    ]);

    return { total, pending, queued, sent, failed, delivered };
  }

  async getUsageLogs(userId: string, limit = 50) {
    return this.prisma.usageLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
