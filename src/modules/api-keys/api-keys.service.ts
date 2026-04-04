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

  async create(userId: string, label?: string, scopes: string[] = ['sms:send'], expiresInDays?: number) {
    if (label && label.length > 50) throw new BadRequestException('Label too long');
    if (scopes.length === 0) throw new BadRequestException('At least one scope is required');

    const rawKey = `${this.config.apiKeyPrefix}${crypto.randomBytes(24).toString('hex')}`;
    const keyHash = this.hashApiKey(rawKey);
    const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 86400000) : null;

    const apiKey = await this.prisma.apiKey.create({
      data: {
        userId,
        keyHash,
        label: label ?? 'default',
        scopes,
        expiresAt,
        keyPrefix: rawKey.slice(0, 10),
      },
      select: { id: true, label: true, createdAt: true, scopes: true, expiresAt: true, keyPrefix: true },
    });

    return { ...apiKey, maskedKey: `${apiKey.keyPrefix}****`, apiKey: rawKey };
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

    return { revoked: result.count };
  }

  hashApiKey(key: string) {
    if (!key.startsWith(this.config.apiKeyPrefix)) throw new BadRequestException('Malformed API key');

    return crypto.createHmac('sha256', this.config.apiKeyHashSecret).update(key).digest('hex');
  }
}
