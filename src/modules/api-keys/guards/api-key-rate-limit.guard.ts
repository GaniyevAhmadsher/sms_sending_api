import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException, HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { RateLimitService } from '../../../infrastructure/rate-limit/rate-limit.service';
import { MetricsService } from '../../../infrastructure/metrics/metrics.service';

@Injectable()
export class ApiKeyRateLimitGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rateLimitService: RateLimitService,
    private readonly metrics: MetricsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKeyId: string | undefined = request.user?.apiKeyId;

    if (!apiKeyId) {
      return true;
    }

    const apiKey = await this.prisma.apiKey.findUnique({
      where: { id: apiKeyId },
      select: { rateLimitRpm: true },
    });

    const limit = apiKey?.rateLimitRpm ?? 60;
    const rate = await this.rateLimitService.consume(`throttle:api-key:${apiKeyId}`, limit, 60);

    if (!rate.allowed) {
      this.metrics.rateLimitHits.inc({ scope: 'api_key' });
      throw new HttpException('API key rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }

    return true;
  }
}
