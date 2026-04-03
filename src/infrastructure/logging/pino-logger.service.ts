import { Injectable, LoggerService } from '@nestjs/common';
import { requestContext } from './request-context';

@Injectable()
export class PinoLoggerService implements LoggerService {
  private emit(level: 'log' | 'error' | 'warn' | 'debug' | 'verbose', message: any, optionalParams: any[] = [], bindings?: Record<string, unknown>) {
    const context = requestContext.getStore();
    const payload = {
      level,
      time: new Date().toISOString(),
      correlationId: context?.correlationId,
      ...bindings,
      message,
      optionalParams,
    };
    const line = JSON.stringify(payload);
    if (level === 'error') console.error(line);
    else if (level === 'warn') console.warn(line);
    else console.log(line);
  }

  log(message: any, ...optionalParams: any[]) { this.emit('log', message, optionalParams); }
  error(message: any, ...optionalParams: any[]) { this.emit('error', message, optionalParams); }
  warn(message: any, ...optionalParams: any[]) { this.emit('warn', message, optionalParams); }
  debug(message: any, ...optionalParams: any[]) { this.emit('debug', message, optionalParams); }
  verbose(message: any, ...optionalParams: any[]) { this.emit('verbose', message, optionalParams); }

  child(bindings: Record<string, unknown>) {
    return {
      info: (data: Record<string, unknown>, message: string) => this.emit('log', message, [data], bindings),
    };
  }
}
