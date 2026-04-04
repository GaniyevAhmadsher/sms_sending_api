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

  async getDailyUsage(userId: string) {
    const rows = await this.prisma.$queryRaw<Array<{ day: Date; total: bigint; failed: bigint }>>`
      SELECT date_trunc('day', "createdAt")::date AS day,
             count(*)::bigint as total,
             count(*) FILTER (WHERE status = 'FAILED')::bigint as failed
      FROM "SmsMessage"
      WHERE "userId" = ${userId}
      GROUP BY 1
      ORDER BY 1 DESC
      LIMIT 30
    `;

    return rows.map((item) => ({ day: item.day, total: Number(item.total), failed: Number(item.failed) }));
  }

  async getRevenueDashboard() {
    const rows = await this.prisma.$queryRaw<Array<{ month: Date; revenue: string; success_payments: bigint }>>`
      SELECT date_trunc('month', "createdAt")::date AS month,
             COALESCE(sum(amount) FILTER (WHERE status = 'SUCCESS'), 0)::text as revenue,
             count(*) FILTER (WHERE status = 'SUCCESS')::bigint as success_payments
      FROM "Payment"
      GROUP BY 1
      ORDER BY 1 DESC
      LIMIT 12
    `;

    return rows;
  }

  async getProviderSuccessRate(userId: string) {
    const rows = await this.prisma.$queryRaw<Array<{ provider: string; total: bigint; sent: bigint }>>`
      SELECT provider,
             count(*)::bigint as total,
             count(*) FILTER (WHERE status IN ('SENT', 'DELIVERED'))::bigint as sent
      FROM "SmsMessage"
      WHERE "userId" = ${userId}
      GROUP BY provider
      ORDER BY total DESC
    `;

    return rows.map((item) => ({
      provider: item.provider,
      total: Number(item.total),
      sent: Number(item.sent),
      successRate: Number(item.total) === 0 ? 0 : Number(item.sent) / Number(item.total),
    }));
  }
}
