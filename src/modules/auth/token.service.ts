import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { AppConfigService } from '../../infrastructure/config/app-config.service';

@Injectable()
export class TokenService {
  constructor(private readonly config: AppConfigService) {}

  sign(payload: { sub: string; email: string; exp?: number }) {
    const exp = payload.exp ?? Math.floor(Date.now() / 1000) + 60 * 60 * 24;
    const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
    const signature = crypto
      .createHmac('sha256', this.config.jwtSecret)
      .update(body)
      .digest('base64url');
    return `${body}.${signature}`;
  }

  verify(token: string): { sub: string; email: string; exp: number } {
    const [body, signature] = token.split('.');
    const expected = crypto
      .createHmac('sha256', this.config.jwtSecret)
      .update(body)
      .digest('base64url');

    if (!body || !signature || signature !== expected) {
      throw new UnauthorizedException('Invalid token');
    }

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as {
      sub: string;
      email: string;
      exp: number;
    };

    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException('Token expired');
    }

    return payload;
  }
}
