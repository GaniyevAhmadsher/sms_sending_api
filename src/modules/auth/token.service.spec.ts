import { UnauthorizedException } from '@nestjs/common';
import { TokenService } from './token.service';

describe('TokenService', () => {
  const config = {
    jwtSecret: 'super-secret',
    jwtIssuer: 'sms-saas',
    jwtAudience: 'sms-api',
    jwtAccessTtlSeconds: 300,
    jwtRefreshTtlSeconds: 3600,
    jwtKeyId: 'primary',
  } as any;

  it('rejects invalid tokens', () => {
    const service = new TokenService(config);
    expect(() => service.verifyAccess('abc.def.ghi')).toThrow(UnauthorizedException);
  });

  it('signs and verifies access token', () => {
    const service = new TokenService(config);
    const token = service.signAccess({ sub: 'u1' });
    const payload = service.verifyAccess(token);
    expect(payload.sub).toBe('u1');
    expect(payload.iss).toBe('sms-saas');
    expect(payload.type).toBe('access');
  });

  it('signs and verifies refresh token', () => {
    const service = new TokenService(config);
    const token = service.signRefresh({ sub: 'u1' });
    const payload = service.verifyRefresh(token);
    expect(payload.type).toBe('refresh');
  });
});
