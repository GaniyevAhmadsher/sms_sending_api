import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { requestContext } from './request-context';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {

  constructor(private readonly metrics: MetricsService) {}

  constructor(private readonly metrics: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const correlationId =
      (typeof req.headers['x-correlation-id'] === 'string' && req.headers['x-correlation-id']) || randomUUID();

    const requestUser = (req as Request & { user?: { sub?: string; tenantId?: string } }).user;
    const userId = requestUser?.sub;
    const tenantId = requestUser?.tenantId;
    const apiKeyId = typeof req.headers['x-api-key-id'] === 'string' ? req.headers['x-api-key-id'] : undefined;

    res.setHeader('x-correlation-id', correlationId);
    const start = process.hrtime.bigint();

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
