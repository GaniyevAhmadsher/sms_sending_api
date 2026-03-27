import { Injectable } from '@nestjs/common';

@Injectable()
export class AppConfigService {
  private getRequired(name: string): string {
    const value = process.env[name];
    if (!value) {
      throw new Error(`Missing required environment variable: ${name}`);
    }

    return value;
  }

  get port() {
    return Number(process.env.PORT ?? 3000);
  }

  get databaseUrl() {
    return this.getRequired('DATABASE_URL');
  }

  get redisHost() {
    return process.env.REDIS_HOST ?? '127.0.0.1';
  }

  get redisPort() {
    return Number(process.env.REDIS_PORT ?? 6379);
  }

  get jwtSecret() {
    return this.getRequired('JWT_SECRET');
  }

  get apiKeyHashSecret() {
    return this.getRequired('API_KEY_HASH_SECRET');
  }

  get smsProvider() {
    return process.env.SMS_PROVIDER ?? 'mock';
  }

  get clickMerchantId() {
    return this.getRequired('CLICK_MERCHANT_ID');
  }

  get clickSecretKey() {
    return this.getRequired('CLICK_SECRET_KEY');
  }

  get paymeMerchantId() {
    return this.getRequired('PAYME_MERCHANT_ID');
  }

  get paymeSecretKey() {
    return this.getRequired('PAYME_SECRET_KEY');
  }

  get paymentReturnUrl() {
    return this.getRequired('PAYMENT_RETURN_URL');
  }
}
