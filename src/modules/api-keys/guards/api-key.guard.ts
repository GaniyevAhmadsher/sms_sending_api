import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { ApiKeysService } from '../api-keys.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly apiKeysService: ApiKeysService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey || typeof apiKey !== 'string') {
      throw new UnauthorizedException('Missing API key');
    }

    const keyHash = this.apiKeysService.hashApiKey(apiKey);
    const candidate = await this.prisma.apiKey.findFirst({
      where: { keyHash, status: 'ACTIVE' },
      include: { user: true },
    });

    if (!candidate) {
      throw new UnauthorizedException('Invalid API key');
    }

    request.user = {
      id: candidate.user.id,
      email: candidate.user.email,
      apiKeyId: candidate.id,
    };

    await this.prisma.apiKey.update({
      where: { id: candidate.id },
      data: { lastUsedAt: new Date() },
    });

    return true;
  }
}
