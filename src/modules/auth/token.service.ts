import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { AppConfigService } from '../../infrastructure/config/app-config.service';

interface TokenPayload {
  sub: string;
  iss: string;
  aud: string;
  iat: number;
  exp: number;
}

@Injectable()
export class TokenService {
  constructor(private readonly config: AppConfigService) {}

  sign(payload: { sub: string }) {
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + this.config.jwtAccessTtlSeconds;
    const fullPayload: TokenPayload = {
      sub: payload.sub,
      iat,
      exp,
      iss: this.config.jwtIssuer,
      aud: this.config.jwtAudience,
    };

    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
    const data = `${header}.${body}`;
    const signature = crypto.createHmac('sha256', this.config.jwtSecret).update(data).digest('base64url');
    return `${data}.${signature}`;
  }

  verify(token: string): TokenPayload {
    const [header, body, signature] = token.split('.');
    if (!header || !body || !signature) {
      throw new UnauthorizedException('Invalid token');
    }

    const data = `${header}.${body}`;
    const expected = crypto.createHmac('sha256', this.config.jwtSecret).update(data).digest('base64url');
    const signatureBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
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
}
