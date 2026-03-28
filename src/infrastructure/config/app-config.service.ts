import { Injectable } from '@nestjs/common';

@Injectable()
export class AppConfigService {
  private getRequired(name: string): string {
    const value = process.env[name];
    if (!value || value.trim().length === 0) {
      throw new Error(`Missing required environment variable: ${name}`);
    }

    return value;
  }

  private getRequiredNumber(name: string): number {
    const raw = this.getRequired(name);
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      throw new Error(`Invalid numeric environment variable: ${name}`);
    }

    return value;
  }

  validate() {
    this.databaseUrl;
    this.redisHost;
    this.redisPort;
    this.redisCommandTimeoutMs;
    this.jwtSecret;
    this.jwtIssuer;
    this.jwtAudience;
    this.jwtAccessTtlSeconds;
    this.apiKeyHashSecret;
    this.clickMerchantId;
    this.clickSecretKey;
    this.paymeMerchantId;
    this.paymeSecretKey;
    this.paymentReturnUrl;
  }

  get port() {
    return this.getRequiredNumber('PORT');
  }

  get databaseUrl() {
    return this.getRequired('DATABASE_URL');
  }

  get redisHost() {
    return this.getRequired('REDIS_HOST');
  }

  get redisPort() {
    return this.getRequiredNumber('REDIS_PORT');
  }

  get redisCommandTimeoutMs() {
    return this.getRequiredNumber('REDIS_COMMAND_TIMEOUT_MS');
  }

  get jwtSecret() {
    return this.getRequired('JWT_SECRET');
  }

  get jwtIssuer() {
    return this.getRequired('JWT_ISSUER');
  }

  get jwtAudience() {
    return this.getRequired('JWT_AUDIENCE');
  }

  get jwtAccessTtlSeconds() {
    return this.getRequiredNumber('JWT_ACCESS_TTL_SECONDS');
  }

  get apiKeyHashSecret() {
    return this.getRequired('API_KEY_HASH_SECRET');
  }

  get smsProvider() {
    return this.getRequired('SMS_PROVIDER');
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
