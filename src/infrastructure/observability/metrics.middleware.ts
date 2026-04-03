import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly metrics: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();

    res.on('finish', () => {
      const durationMs = Date.now() - start;
      this.metrics.observe('api_request_duration', durationMs, {
        method: req.method,
        route: req.path,
        status_code: res.statusCode,
      });

      if (res.statusCode === 429) {
        this.metrics.increment('rate_limit_hits', 1, { route: req.path });
      }
    });

    next();
  }
}
