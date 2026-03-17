import { Injectable } from '@nestjs/common';
import { Socket } from 'net';
import { AppConfigService } from '../config/app-config.service';

@Injectable()
export class RedisService {
  constructor(private readonly config: AppConfigService) {}

  async ping(): Promise<boolean> {
    try {
      const response = await this.sendCommand(['PING']);
      return response === 'PONG';
    } catch {
      return false;
    }
  }

  async incrementWithExpiry(key: string, ttlSec: number): Promise<number> {
    const current = await this.sendCommand(['INCR', key]);
    if (Number(current) === 1) {
      await this.sendCommand(['EXPIRE', key, String(ttlSec)]);
    }
    return Number(current);
  }

  async rpush(key: string, value: string): Promise<number> {
    const result = await this.sendCommand(['RPUSH', key, value]);
    return Number(result);
  }

  async lpop(key: string): Promise<string | null> {
    const result = await this.sendCommand(['LPOP', key], true);
    return result;
  }

  private sendCommand(args: string[], allowNullBulk = false): Promise<string | null> {
    return new Promise((resolve, reject) => {
      const socket = new Socket();
      let result = '';
      socket.setTimeout(1500);

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
        if (!result) {
          reject(new Error('No Redis response'));
          return;
        }

        if (result.startsWith('+')) {
          resolve(result.replace(/^\+/, '').trim());
          return;
        }

        if (result.startsWith(':')) {
          resolve(result.replace(/^:/, '').trim());
          return;
        }

        if (result.startsWith('$-1') && allowNullBulk) {
          resolve(null);
          return;
        }

        if (result.startsWith('$')) {
          const parts = result.split('\r\n');
          resolve(parts[1] ?? '');
          return;
        }

        reject(new Error(result.trim()));
      });
    });
  }

  private toResp(args: string[]) {
    const body = args.map((arg) => `$${Buffer.byteLength(arg)}\r\n${arg}\r\n`).join('');
    return `*${args.length}\r\n${body}`;
  }
}
