import { Injectable, LoggerService } from '@nestjs/common';
import { requestContext } from './request-context';
import { AppConfigService } from '../config/app-config.service';

@Injectable()
export class PinoLoggerService implements LoggerService {
  constructor(private readonly config: AppConfigService) {}

  log(message: any, context?: string) {
    this.print('info', message, context);
  }

  error(message: any, trace?: string, context?: string) {
    this.print('error', message, context, { trace });
  }

  warn(message: any, context?: string) {
    this.print('warn', message, context);
  }

  debug(message: any, context?: string) {
    this.print('debug', message, context);
  }

  verbose(message: any, context?: string) {
    this.print('trace', message, context);
  }

  private print(level: string, message: any, context?: string, extra: Record<string, unknown> = {}) {
    const reqCtx = requestContext.getStore();
    const payload = {
      level,
      service: 'sms-sending-api',
      env: this.config.nodeEnv,
      timestamp: new Date().toISOString(),
      context,
      correlationId: reqCtx?.correlationId,
      ...extra,
      message,
    };

    process.stdout.write(`${JSON.stringify(payload)}\n`);
  }
}
