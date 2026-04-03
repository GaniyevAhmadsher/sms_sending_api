import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException, HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimitService } from './rate-limit.service';
import { MetricsService } from '../metrics/metrics.service';
import { SKIP_GLOBAL_THROTTLE } from './skip-global-throttle.decorator';

@Injectable()
export class GlobalThrottleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rateLimitService: RateLimitService,
    private readonly metrics: MetricsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_GLOBAL_THROTTLE, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const ip = request.ip ?? request.headers['x-forwarded-for'] ?? 'unknown';
    const rate = await this.rateLimitService.consume(`throttle:ip:${ip}`, 200, 60);

    if (!rate.allowed) {
      this.metrics.rateLimitHits.inc({ scope: 'global' });
      throw new HttpException('Global rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }

    return true;
  }
}
