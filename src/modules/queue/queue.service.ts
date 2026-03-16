import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { QueueConnectionService } from '../../infrastructure/queue/queue-connection.service';
import { SMS_QUEUE } from './queue.constants';

@Injectable()
export class QueueService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queueConnection: QueueConnectionService,
  ) {}

  async enqueueSmsJob(payload: { smsId: string }) {
    await this.prisma.smsMessage.update({
      where: { id: payload.smsId },
      data: {
        status: 'QUEUED',
        queuedAt: new Date(),
      },
    });

    await this.queueConnection.publish(SMS_QUEUE, payload);
  }
}
