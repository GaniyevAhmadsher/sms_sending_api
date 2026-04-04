import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { AppConfigService } from '../../infrastructure/config/app-config.service';

@Injectable()
export class ApiKeysService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {}

  async create(userId: string, label?: string, rateLimitRpm?: number) {
    if (label && label.length > 50) {
      throw new BadRequestException('Label too long');
    }
    if (rateLimitRpm !== undefined && (!Number.isInteger(rateLimitRpm) || rateLimitRpm < 1 || rateLimitRpm > 10000)) {
      throw new BadRequestException('rateLimitRpm must be between 1 and 10000');
    }

    const rawKey = `${this.config.apiKeyPrefix}${crypto.randomBytes(24).toString('hex')}`;
    const keyHash = this.hashApiKey(rawKey);
    const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 86400000) : null;

    const apiKey = await this.prisma.apiKey.create({
      data: {
        userId,
        keyHash,
        label: label ?? 'default',
        rateLimitRpm: rateLimitRpm ?? 60,
      },
      select: { id: true, label: true, rateLimitRpm: true, createdAt: true },
    });

    return { ...apiKey, apiKey: rawKey, prefix: rawKey.slice(0, this.config.apiKeyPrefix.length + 4) };
  }

  async listMasked(userId: string) {
    const keys = await this.prisma.apiKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, label: true, status: true, rateLimitRpm: true, createdAt: true, lastUsedAt: true, revokedAt: true },
    });

    return keys.map((item) => ({ ...item, maskedKey: `${this.config.apiKeyPrefix}****` }));
  }

  async revoke(userId: string, id: string) {
    const apiKey = await this.prisma.apiKey.findFirst({ where: { id, userId } });
    if (!apiKey) throw new NotFoundException('API key not found');

    return this.prisma.apiKey.update({
      where: { id },
      data: { status: 'REVOKED', revokedAt: new Date() },
      select: { id: true, status: true, revokedAt: true },
    });
  }

  async revokeAll(userId: string) {
    const result = await this.prisma.apiKey.updateMany({
      where: { userId, status: 'ACTIVE' },
      data: { status: 'REVOKED', revokedAt: new Date() },
    });
    return { revokedCount: result.count };
  }

  hashApiKey(key: string) {
    if (!key.startsWith(this.config.apiKeyPrefix)) {
      throw new BadRequestException('Malformed API key');
    }

    return crypto.createHmac('sha256', this.config.apiKeyHashSecret).update(key).digest('hex');
  }
}
