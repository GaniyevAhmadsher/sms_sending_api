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

  private getOptional(name: string): string | undefined {
    const value = process.env[name];
    return value && value.trim().length > 0 ? value : undefined;
  }

  private getRequiredNumber(name: string): number {
    const value = Number(this.getRequired(name));
    if (!Number.isFinite(value)) {
      throw new Error(`Invalid numeric environment variable: ${name}`);
    }
    return value;
  }

  validate() {
    this.port;
    this.nodeEnv;
    this.databaseUrl;
    this.redisHost;
    this.redisPort;
    this.redisCommandTimeoutMs;
    this.jwtSecret;
    this.jwtIssuer;
    this.jwtAudience;
    this.jwtAccessTtlSeconds;
    this.jwtRefreshTtlSeconds;
    this.apiKeyHashSecret;
    this.clickMerchantId;
    this.clickSecretKey;
    this.paymeMerchantId;
    this.paymeSecretKey;
    this.paymentReturnUrl;
    this.webhookTimestampToleranceSeconds;
    this.webhookNonceTtlSeconds;

    if (this.jwtSecret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters');
    }

    if (this.apiKeyHashSecret.length < 32) {
      throw new Error('API_KEY_HASH_SECRET must be at least 32 characters');
    }
  }

  get port() { return this.getRequiredNumber('PORT'); }
  get nodeEnv() { return this.getRequired('NODE_ENV'); }
  get databaseUrl() { return this.getRequired('DATABASE_URL'); }
  get redisHost() { return this.getRequired('REDIS_HOST'); }
  get redisPort() { return this.getRequiredNumber('REDIS_PORT'); }
  get redisCommandTimeoutMs() { return this.getRequiredNumber('REDIS_COMMAND_TIMEOUT_MS'); }
  get redisPassword() { return this.getOptional('REDIS_PASSWORD'); }
  get jwtSecret() { return this.getRequired('JWT_SECRET'); }
  get jwtIssuer() { return this.getRequired('JWT_ISSUER'); }
  get jwtAudience() { return this.getRequired('JWT_AUDIENCE'); }
  get jwtAccessTtlSeconds() { return this.getRequiredNumber('JWT_ACCESS_TTL_SECONDS'); }
  get jwtRefreshTtlSeconds() { return this.getRequiredNumber('JWT_REFRESH_TTL_SECONDS'); }
  get apiKeyHashSecret() { return this.getRequired('API_KEY_HASH_SECRET'); }
  get smsProvider() { return this.getRequired('SMS_PROVIDER'); }
  get clickMerchantId() { return this.getRequired('CLICK_MERCHANT_ID'); }
  get clickSecretKey() { return this.getRequired('CLICK_SECRET_KEY'); }
  get paymeMerchantId() { return this.getRequired('PAYME_MERCHANT_ID'); }
  get paymeSecretKey() { return this.getRequired('PAYME_SECRET_KEY'); }
  get paymentReturnUrl() { return this.getRequired('PAYMENT_RETURN_URL'); }
  get webhookTimestampToleranceSeconds() { return this.getRequiredNumber('WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS'); }
  get webhookNonceTtlSeconds() { return this.getRequiredNumber('WEBHOOK_NONCE_TTL_SECONDS'); }
}
