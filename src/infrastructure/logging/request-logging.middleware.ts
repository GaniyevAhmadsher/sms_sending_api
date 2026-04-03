import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { requestContext } from './request-context';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('RequestLogger');

  constructor(private readonly metrics: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const correlationId =
      (typeof req.headers['x-correlation-id'] === 'string' &&
        req.headers['x-correlation-id']) ||
      randomUUID();

    res.setHeader('x-correlation-id', correlationId);
    const start = Date.now();

    requestContext.run({ correlationId }, () => {
      res.on('finish', () => {
        const durationMs = Date.now() - start;
        this.metrics.apiRequestDuration.observe(
          { method: req.method, path: req.route?.path ?? req.path, status: String(res.statusCode) },
          durationMs,
        );

        this.logger.log(
          JSON.stringify({
            correlationId,
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            durationMs,
            userId: (req as any).user?.id,
            apiKeyId: (req as any).user?.apiKeyId,
          }),
        );
      });

      next();
    });
  }
}
