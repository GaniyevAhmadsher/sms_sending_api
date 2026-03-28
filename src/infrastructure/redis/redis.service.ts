import { Injectable } from '@nestjs/common';
import { Socket } from 'net';
import { AppConfigService } from '../config/app-config.service';

@Injectable()
export class RedisService {
  constructor(private readonly config: AppConfigService) {}

  async ping(): Promise<boolean> {
    try {
      const response = await this.sendCommandWithRetry(['PING']);
      return response === 'PONG';
    } catch {
      return false;
    }
  }

  async incrementWithExpiry(key: string, ttlSec: number): Promise<number> {
    const current = await this.sendCommandWithRetry(['INCR', key]);
    if (Number(current) === 1) {
      await this.sendCommandWithRetry(['EXPIRE', key, String(ttlSec)]);
    }
    return Number(current);
  }

  async rpush(key: string, value: string): Promise<number> {
    const result = await this.sendCommandWithRetry(['RPUSH', key, value]);
    return Number(result);
  }

  async lpop(key: string): Promise<string | null> {
    const result = await this.sendCommandWithRetry(['LPOP', key], true);
    return result;
  }

  private async sendCommandWithRetry(args: string[], allowNullBulk = false): Promise<string | null> {
    const maxAttempts = 3;
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await this.sendCommand(args, allowNullBulk);
      } catch (error) {
        lastError = error;
        if (attempt === maxAttempts) break;
        await new Promise((resolve) => setTimeout(resolve, attempt * 50));
      }
    }

    throw lastError;
  }

  private sendCommand(args: string[], allowNullBulk = false): Promise<string | null> {
    return new Promise((resolve, reject) => {
      const socket = new Socket();
      let result = '';
      socket.setTimeout(this.config.redisCommandTimeoutMs);

      socket.connect(this.config.redisPort, this.config.redisHost, () => {
        socket.write(this.toResp(args));
      });

      socket.on('data', (chunk: Buffer) => {
        result += chunk.toString('utf8');
      });

      socket.on('timeout', () => {
        socket.destroy();
        reject(new Error('Redis timeout'));
      });

      socket.on('error', (error) => {
        socket.destroy();
        reject(error);
      });

      socket.on('close', () => {
        if (!result) return reject(new Error('No Redis response'));
        if (result.startsWith('+')) return resolve(result.replace(/^\+/, '').trim());
        if (result.startsWith(':')) return resolve(result.replace(/^:/, '').trim());
        if (result.startsWith('$-1') && allowNullBulk) return resolve(null);
        if (result.startsWith('$')) return resolve(result.split('\r\n')[1] ?? '');
        reject(new Error(result.trim()));
      });
    });
  }

  private toResp(args: string[]) {
    const body = args.map((arg) => `$${Buffer.byteLength(arg)}\r\n${arg}\r\n`).join('');
    return `*${args.length}\r\n${body}`;
  }
}
