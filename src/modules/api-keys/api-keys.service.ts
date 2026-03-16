import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, label?: string) {
    if (label && label.length > 50) {
      throw new BadRequestException('Label too long');
    }

    const rawKey = `sms_${crypto.randomBytes(24).toString('hex')}`;
    const keyHash = this.hashApiKey(rawKey);

    const apiKey = await this.prisma.apiKey.create({
      data: {
        userId,
        keyHash,
        label: label ?? 'default',
      },
      select: { id: true, label: true, createdAt: true },
    });

    return { ...apiKey, apiKey: rawKey };
  }

  async revoke(userId: string, id: string) {
    const apiKey = await this.prisma.apiKey.findFirst({ where: { id, userId } });
    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    return this.prisma.apiKey.update({
      where: { id },
      data: { status: 'REVOKED', revokedAt: new Date() },
      select: { id: true, status: true, revokedAt: true },
    });
  }

  hashApiKey(key: string) {
    const secret = process.env.API_KEY_HASH_SECRET ?? 'api-key-secret';
    return crypto.createHmac('sha256', secret).update(key).digest('hex');
  }
}
