import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { requestContext } from './request-context';
import { MetricsService } from '../observability/metrics.service';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {

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
        const durationSeconds = Number(process.hrtime.bigint() - start) / 1_000_000_000;
        this.metrics.apiRequestDuration
          .labels({ method: req.method, route: req.route?.path ?? req.path ?? 'unknown', status_code: String(res.statusCode) })
          .observe(durationSeconds);

        console.log(JSON.stringify({
          correlationId,
          method: req.method,
          path: req.originalUrl,
          statusCode: res.statusCode,
          durationMs: Math.round(durationSeconds * 1000),
          userId,
          tenantId,
          apiKeyId,
          paymentId: req.headers['x-payment-id'],
          smsId: req.headers['x-sms-id'],
          jobId: req.headers['x-job-id'],
          ip: req.ip,
          userAgent: req.headers['user-agent'],
        }));
      });

      next();
    });
  }
}
