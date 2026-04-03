import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { requestContext } from './request-context';
import { PinoLoggerService } from './pino-logger.service';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  constructor(
    private readonly logger: PinoLoggerService,
    private readonly metrics: MetricsService,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const correlationId =
      (typeof req.headers['x-correlation-id'] === 'string' && req.headers['x-correlation-id']) || randomUUID();

    const context = {
      correlationId,
      userId: (req as any).user?.sub,
      apiKeyId: typeof req.headers['x-api-key-id'] === 'string' ? req.headers['x-api-key-id'] : undefined,
      tenantId: typeof req.headers['x-tenant-id'] === 'string' ? req.headers['x-tenant-id'] : undefined,
    };

    res.setHeader('x-correlation-id', correlationId);
    const started = process.hrtime.bigint();

    requestContext.run({ correlationId }, () => {
      res.on('finish', () => {
        const durationSeconds = Number(process.hrtime.bigint() - started) / 1_000_000_000;
        this.metrics.apiRequestDuration
          .labels(req.method, req.route?.path ?? req.path ?? req.originalUrl, String(res.statusCode))
          .observe(durationSeconds);

        this.logger.child(context).info(
          {
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            durationMs: Math.round(durationSeconds * 1000),
          },
          'request.completed',
        );
      });

      next();
    });
  }
}
