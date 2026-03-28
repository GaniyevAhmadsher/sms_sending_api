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

    res.setHeader('x-correlation-id', correlationId);
    const start = Date.now();

    requestContext.run({ correlationId }, () => {
      res.on('finish', () => {
        this.logger.log(
          JSON.stringify({
            correlationId,
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            durationMs: Date.now() - start,
          }),
        );
      });

      next();
    });
  }
}
