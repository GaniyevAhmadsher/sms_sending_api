import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSmsStats(userId: string) {
    const [total, sent, failed, queued] = await Promise.all([
      this.prisma.smsMessage.count({ where: { userId } }),
      this.prisma.smsMessage.count({ where: { userId, status: 'SENT' } }),
      this.prisma.smsMessage.count({ where: { userId, status: 'FAILED' } }),
      this.prisma.smsMessage.count({ where: { userId, status: 'QUEUED' } }),
    ]);

    return { total, sent, failed, queued };
  }

  async getUsageLogs(userId: string, limit = 50) {
    return this.prisma.usageLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
