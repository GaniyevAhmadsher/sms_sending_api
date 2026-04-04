import { UnauthorizedException } from '@nestjs/common';
import { TokenService } from './token.service';

describe('TokenService', () => {
  const config = {
    jwtIssuer: 'sms-saas',
    jwtAudience: 'sms-api',
    jwtAccessTtlSeconds: 300,
    jwtRefreshTtlSeconds: 7200,
    jwtSecretKid: 'v1',
    jwtRefreshSecretKid: 'r1',
    jwtSecretByKid: new Map([
      ['v1', 'super-secret-super-secret-super-secret-1'],
      ['v0', 'legacy-secret-legacy-secret-legacy-000'],
    ]),
    jwtRefreshSecretByKid: new Map([
      ['r1', 'super-refresh-secret-super-refresh-1'],
      ['r0', 'legacy-refresh-secret-legacy-refresh0'],
    ]),
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

  it('signs and verifies refresh token', () => {
    const service = new TokenService(config);
    const token = service.signRefreshToken({ sub: 'u1' });
    const payload = service.verifyRefreshToken(token);
    expect(payload.sub).toBe('u1');
    expect(payload.typ).toBe('refresh');
  });
});
