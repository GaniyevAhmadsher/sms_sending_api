import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { MetricsService } from '../metrics/metrics.service';
import { requestContext } from './request-context';

@Injectable()
export class RequestLoggingMiddleware {
  private readonly logger = new Logger(RequestLoggingMiddleware.name);

  constructor(private readonly metrics: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const correlationId =
      (typeof req.headers['x-correlation-id'] === 'string' && req.headers['x-correlation-id']) || randomUUID();

    res.setHeader('x-correlation-id', correlationId);
    const startedAt = Date.now();

    requestContext.run({ correlationId }, () => {
      res.on('finish', () => {
        const durationMs = Date.now() - startedAt;
        const user = (req as Request & { user?: { id?: string; sub?: string; tenantId?: string; apiKeyId?: string } }).user;

        this.metrics.apiRequestDuration.observe(
          {
            method: req.method,
            path: req.route?.path ?? req.path,
            status: String(res.statusCode),
          },
          durationMs,
        );

        this.logger.log(
          JSON.stringify({
            correlationId,
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            durationMs,
            userId: user?.id ?? user?.sub,
            tenantId: user?.tenantId,
            apiKeyId: user?.apiKeyId,
          }),
        );
      });

      next();
    });
  }
}
