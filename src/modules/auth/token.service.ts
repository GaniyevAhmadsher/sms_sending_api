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

  signAccess(payload: { sub: string }) {
    return this.sign(payload.sub, 'access', this.config.jwtAccessTtlSeconds);
  }

  signRefresh(payload: { sub: string }) {
    return this.sign(payload.sub, 'refresh', this.config.jwtRefreshTtlSeconds);
  }

  verifyAccess(token: string): TokenPayload {
    const payload = this.verify(token);
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }
    return payload;
  }

  verifyRefresh(token: string): TokenPayload {
    const payload = this.verify(token);
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }
    return payload;
  }

  private sign(sub: string, type: TokenPayload['type'], ttlSeconds: number): string {
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + ttlSeconds;
    const fullPayload: TokenPayload = {
      sub,
      iat,
      exp,
      iss: this.config.jwtIssuer,
      aud: this.config.jwtAudience,
      type,
    };

    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT', kid: this.config.jwtKeyId })).toString(
      'base64url',
    );
    const body = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
    const data = `${header}.${body}`;
    const signature = crypto.createHmac('sha256', this.config.jwtSecret).update(data).digest('base64url');
    return `${data}.${signature}`;
  }

  private verify(token: string): TokenPayload {
    const [header, body, signature] = token.split('.');
    if (!header || !body || !signature) {
      throw new UnauthorizedException('Invalid token');
    }

    const data = `${header}.${body}`;
    const valid = this.getCandidateSecrets().some((secret) => {
      const expected = crypto.createHmac('sha256', secret).update(data).digest('base64url');
      const signatureBuffer = Buffer.from(signature);
      const expectedBuffer = Buffer.from(expected);
      return signatureBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
    });

    if (!valid) {
      throw new UnauthorizedException('Invalid token signature');
    }

    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as TokenPayload;
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp <= now || payload.iat > now + 10) {
      throw new UnauthorizedException('Token expired or malformed');
    }

    if (payload.iss !== this.config.jwtIssuer || payload.aud !== this.config.jwtAudience || !payload.sub) {
      throw new UnauthorizedException('Token issuer/audience invalid');
    }

    return payload;
  }

  private getCandidateSecrets(): string[] {
    const previous = process.env.JWT_PREVIOUS_SECRETS?.split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    return [this.config.jwtSecret, ...(previous ?? [])];
  }
}
