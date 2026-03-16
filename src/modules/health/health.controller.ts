import { Controller, Get } from '@nestjs/common';
import { SkipGlobalThrottle } from '../../infrastructure/rate-limit/skip-global-throttle.decorator';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @SkipGlobalThrottle()
  check() {
    return this.healthService.check();
  }
}
