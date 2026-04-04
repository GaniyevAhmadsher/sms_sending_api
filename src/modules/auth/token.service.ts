import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { AppConfigService } from '../../infrastructure/config/app-config.service';

interface TokenPayload {
  sub: string;
  iss: string;
  aud: string;
  iat: number;
  exp: number;
  typ: 'access' | 'refresh';
}

interface JwtHeader {
  alg: 'HS256';
  typ: 'JWT';
  kid: string;
}

@Injectable()
export class TokenService {
  constructor(private readonly config: AppConfigService) {}

  signAccessToken(payload: { sub: string }) {
    return this.signToken(payload.sub, 'access', this.config.jwtAccessTtlSeconds, this.config.jwtSecretKid);
  }

  signRefreshToken(payload: { sub: string }) {
    return this.signToken(payload.sub, 'refresh', this.config.jwtRefreshTtlSeconds, this.config.jwtRefreshSecretKid);
  }

  verifyAccessToken(token: string): TokenPayload {
    return this.verifyToken(token, 'access', this.config.jwtSecretByKid);
  }

  verifyRefreshToken(token: string): TokenPayload {
    return this.verifyToken(token, 'refresh', this.config.jwtRefreshSecretByKid);
  }

  private signToken(sub: string, typ: TokenPayload['typ'], ttl: number, kid: string) {
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + ttl;
    const fullPayload: TokenPayload = {
      sub,
      iat,
      exp,
      iss: this.config.jwtIssuer,
      aud: this.config.jwtAudience,
      typ,
    };

    const header: JwtHeader = { alg: 'HS256', typ: 'JWT', kid };
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const body = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
    const data = `${encodedHeader}.${body}`;
    const secret = this.secretForKid(kid, typ);
    const signature = crypto.createHmac('sha256', secret).update(data).digest('base64url');
    return `${data}.${signature}`;
  }

  private verifyToken(token: string, expectedType: TokenPayload['typ'], secretMap: Map<string, string>): TokenPayload {
    const [header, body, signature] = token.split('.');
    if (!header || !body || !signature) {
      throw new UnauthorizedException('Invalid token');
    }

    const parsedHeader = JSON.parse(Buffer.from(header, 'base64url').toString('utf8')) as JwtHeader;
    const kid = parsedHeader.kid;
    if (!kid) {
      throw new UnauthorizedException('Missing token key id');
    }

    const secret = secretMap.get(kid);
    if (!secret) {
      throw new UnauthorizedException('Unknown token key id');
    }

    const data = `${header}.${body}`;
    const expected = crypto.createHmac('sha256', secret).update(data).digest('base64url');
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

    if (
      payload.typ !== expectedType ||
      payload.iss !== this.config.jwtIssuer ||
      payload.aud !== this.config.jwtAudience ||
      !payload.sub
    ) {
      throw new UnauthorizedException('Token issuer/audience invalid');
    }

    return payload;
  }

  private secretForKid(kid: string, typ: TokenPayload['typ']) {
    const map = typ === 'access' ? this.config.jwtSecretByKid : this.config.jwtRefreshSecretByKid;
    const secret = map.get(kid);
    if (!secret) {
      throw new UnauthorizedException('Token key is not configured');
    }
    return secret;
  }
}
