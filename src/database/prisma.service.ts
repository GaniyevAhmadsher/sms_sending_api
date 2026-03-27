import { Injectable, OnModuleDestroy } from '@nestjs/common';

@Injectable()
export class PrismaService implements OnModuleDestroy {
  private readonly client: any;

  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient } = require('@prisma/client');
    this.client = new PrismaClient();
  }

  get user() {
    return this.client.user;
  }

  get apiKey() {
    return this.client.apiKey;
  }

  get smsMessage() {
    return this.client.smsMessage;
  }

  get transaction() {
    return this.client.transaction;
  }

  get payment() {
    return this.client.payment;
  }

  get usageLog() {
    return this.client.usageLog;
  }

  $transaction(callback: (tx: any) => Promise<unknown>) {
    return this.client.$transaction(callback);
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }
}
