import { Injectable } from '@nestjs/common';

@Injectable()
export class AppConfigService {
  get port() {
    return Number(process.env.PORT ?? 3000);
  }

  get databaseUrl() {
    return process.env.DATABASE_URL ?? '';
  }

  get redisHost() {
    return process.env.REDIS_HOST ?? '127.0.0.1';
  }

  get redisPort() {
    return Number(process.env.REDIS_PORT ?? 6379);
  }

  get jwtSecret() {
    return process.env.JWT_SECRET ?? 'dev-secret';
  }

  get smsProvider() {
    return process.env.SMS_PROVIDER ?? 'mock';
  }
}
