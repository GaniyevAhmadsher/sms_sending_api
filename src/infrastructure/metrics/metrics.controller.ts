import { Controller, Get, Header } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { SkipGlobalThrottle } from '../rate-limit/skip-global-throttle.decorator';

@Controller()
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get('metrics')
  @SkipGlobalThrottle()
  @Header('Content-Type', 'text/plain; version=0.0.4')
  async getMetrics() {
    return this.metrics.metrics();
  }
}
