import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as crypto from 'crypto';
import { AppConfigService } from '../../infrastructure/config/app-config.service';

@Injectable()
export class ApiKeysService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {}

  async create(userId: string, label?: string) {
    if (label && label.length > 50) {
      throw new BadRequestException('Label too long');
    }
    const rawKey = `${this.config.apiKeyPrefix}${crypto.randomBytes(24).toString('hex')}`;
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
    if (!key.startsWith(this.config.apiKeyPrefix)) {
      throw new BadRequestException('Malformed API key');
    }

    return crypto
      .createHmac('sha256', this.config.apiKeyHashSecret)
      .update(key)
      .digest('hex');
  }
}
