import { UnauthorizedException } from '@nestjs/common';
import { TokenService } from './token.service';

describe('TokenService', () => {
  const config = {
    jwtSecret: 'super-secret-super-secret-super-secret',
    jwtIssuer: 'sms-saas',
    jwtAudience: 'sms-api',
    jwtAccessTtlSeconds: 300,
    jwtRefreshTtlSeconds: 3600,
  } as any;

  it('rejects invalid tokens', () => {
    const service = new TokenService(config);
    expect(() => service.verifyAccessToken('abc.def.ghi')).toThrow(UnauthorizedException);
  });

  it('signs and verifies access token', () => {
    const service = new TokenService(config);
    const token = service.signAccessToken({ sub: 'u1' });
    const payload = service.verifyAccessToken(token);
    expect(payload.sub).toBe('u1');
    expect(payload.iss).toBe('sms-saas');
    expect(payload.typ).toBe('access');
  });
});
