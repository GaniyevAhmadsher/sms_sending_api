import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { AppConfigService } from '../../infrastructure/config/app-config.service';

interface TokenPayload {
  sub: string;
  iss: string;
  aud: string;
  iat: number;
  exp: number;
  type: 'access' | 'refresh';
}

@Injectable()
export class TokenService {
  constructor(private readonly config: AppConfigService) {}

  sign(payload: { sub: string }) {
    return this.signToken(payload.sub, 'access', this.config.jwtAccessTtlSeconds);
  }

  signRefreshToken(payload: { sub: string }) {
    return this.signToken(payload.sub, 'refresh', this.config.jwtRefreshTtlSeconds);
  }

  verify(token: string): TokenPayload {
    return this.verifyToken(token, 'access');
  }

  verifyRefreshToken(token: string): TokenPayload {
    return this.verifyToken(token, 'refresh');
  }

  private signToken(sub: string, type: 'access' | 'refresh', ttlSeconds: number): string {
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + ttlSeconds;
    const fullPayload: TokenPayload = {
      sub,
      iat,
      exp,
      type,
      iss: this.config.jwtIssuer,
      aud: this.config.jwtAudience,
    };

    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
    const data = `${header}.${body}`;
    const signature = crypto.createHmac('sha256', this.config.jwtSecret).update(data).digest('base64url');
    return `${data}.${signature}`;
  }

  private verifyToken(token: string, expectedType: 'access' | 'refresh'): TokenPayload {
    const [header, body, signature] = token.split('.');
    if (!header || !body || !signature) {
      throw new UnauthorizedException('Invalid token');
    }

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as TokenPayload;
    const data = `${header}.${body}`;

    const activeSecret = this.verifySignature(data, signature, this.config.jwtSecret);
    const rotatedSecret = this.config.jwtPreviousSecret
      ? this.verifySignature(data, signature, this.config.jwtPreviousSecret)
      : false;

    if (!activeSecret && !rotatedSecret) {
      throw new UnauthorizedException('Invalid token signature');
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp <= now || payload.iat > now + 10) {
      throw new UnauthorizedException('Token expired or malformed');
    }

    if (
      payload.iss !== this.config.jwtIssuer ||
      payload.aud !== this.config.jwtAudience ||
      !payload.sub ||
      payload.type !== expectedType
    ) {
      throw new UnauthorizedException('Token claims invalid');
    }

    return payload;
  }

  private verifySignature(data: string, signature: string, secret: string): boolean {
    const expected = crypto.createHmac('sha256', secret).update(data).digest('base64url');
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    return signatureBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
  }
}
