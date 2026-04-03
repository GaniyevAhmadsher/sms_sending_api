import { Controller, Get, Header } from '@nestjs/common';
import { SkipGlobalThrottle } from '../rate-limit/skip-global-throttle.decorator';
import { MetricsService } from './metrics.service';

@Controller()
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get('metrics')
  @SkipGlobalThrottle()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  getMetrics() {
    return this.metrics.renderPrometheus();
  }
}
