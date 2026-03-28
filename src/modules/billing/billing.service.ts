import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

type TransactionClient = Parameters<PrismaService['$transaction']>[0] extends (tx: infer T) => Promise<unknown>
  ? T
  : never;

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  async chargeSmsInTransaction(tx: TransactionClient, userId: string, smsId: string, cost = 1) {
    const updated = await tx.$executeRaw`
      UPDATE "User"
      SET "balance" = "balance" - ${cost}
      WHERE "id" = ${userId} AND "balance" >= ${cost}
    `;

    if (updated !== 1) {
      throw new BadRequestException('Insufficient balance');
    }

    await tx.transaction.create({
      data: {
        userId,
        type: 'SMS_DEDUCTION',
        amount: cost,
        description: `SMS charge for message ${smsId}`,
        metadata: { smsId, cost },
      },
    });
  }

  async applyPaymentTopupInTransaction(
    tx: TransactionClient,
    userId: string,
    paymentId: string,
    provider: 'CLICK' | 'PAYME',
    amount: number,
  ) {
    await tx.user.update({ where: { id: userId }, data: { balance: { increment: amount } } });

    await tx.transaction.create({
      data: {
        userId,
        type: 'PAYMENT_TOPUP',
        amount,
        description: `${provider} top-up for payment ${paymentId}`,
        metadata: { paymentId, provider, amount },
      },
    });
  }

  async deductForSms(userId: string, smsId: string, cost = 1) {
    return this.prisma.$transaction(async (tx) => {
      await this.chargeSmsInTransaction(tx, userId, smsId, cost);
    });
  }
}
