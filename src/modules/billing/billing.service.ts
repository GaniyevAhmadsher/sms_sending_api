import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  async deductForSms(userId: string, smsId: string, cost = 1) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new BadRequestException('User not found');
      }

      if (Number(user.balance) < cost) {
        throw new BadRequestException('Insufficient balance');
      }

      await tx.user.update({
        where: { id: userId },
        data: {
          balance: { decrement: cost },
        },
      });

      await tx.transaction.create({
        data: {
          userId,
          type: 'SMS_DEDUCTION',
          amount: cost,
          description: `SMS charge for message ${smsId}`,
        },
      });
    });
  }
}
