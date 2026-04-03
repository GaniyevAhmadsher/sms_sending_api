import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { requestContext } from './request-context';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger('RequestLogger');

  use(req: Request, res: Response, next: NextFunction) {
    const correlationId =
      (typeof req.headers['x-correlation-id'] === 'string' &&
        req.headers['x-correlation-id']) ||
      randomUUID();

    const userId = typeof req.headers['x-user-id'] === 'string' ? req.headers['x-user-id'] : undefined;
    const tenantId = typeof req.headers['x-tenant-id'] === 'string' ? req.headers['x-tenant-id'] : undefined;
    const apiKeyId = typeof req.headers['x-api-key-id'] === 'string' ? req.headers['x-api-key-id'] : undefined;

    res.setHeader('x-correlation-id', correlationId);
    const start = Date.now();

    requestContext.run({ correlationId, userId, tenantId, apiKeyId }, () => {
      res.on('finish', () => {
        this.logger.log(
          JSON.stringify({
            correlationId,
            userId,
            apiKeyId,
            tenantId,
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            durationMs: Date.now() - start,
            userAgent: req.headers['user-agent'],
            remoteIp: req.ip,
          }),
        );
      });

      next();
    });
  }
}
