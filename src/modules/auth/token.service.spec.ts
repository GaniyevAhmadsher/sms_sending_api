import { UnauthorizedException } from '@nestjs/common';
import { TokenService } from './token.service';

describe('TokenService', () => {
  const config = {
    jwtSecret: 'super-secret',
    jwtIssuer: 'sms-saas',
    jwtAudience: 'sms-api',
    jwtAccessTtlSeconds: 300,
  } as any;

  it('rejects invalid tokens', () => {
    const service = new TokenService(config);
    expect(() => service.verify('abc.def.ghi')).toThrow(UnauthorizedException);
  });

  it('signs and verifies token', () => {
    const service = new TokenService(config);
    const token = service.sign({ sub: 'u1' });
    const payload = service.verify(token);
    expect(payload.sub).toBe('u1');
    expect(payload.iss).toBe('sms-saas');
  });
});
