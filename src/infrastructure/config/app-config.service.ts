import { Injectable } from '@nestjs/common';
import { parseEnv, type EnvSchema } from './env.schema';

@Injectable()
export class AppConfigService {
  private readonly env: EnvSchema;

  constructor() {
    this.env = parseEnv();
  }

  validate() {
    return this.env;
  }

  get nodeEnv() {
    return this.env.NODE_ENV;
  }

  get port() {
    return this.env.PORT;
  }

  get databaseUrl() {
    return this.env.DATABASE_URL;
  }

  get redisHost() {
    return this.env.REDIS_HOST;
  }

  get redisPort() {
    return this.env.REDIS_PORT;
  }

  get redisCommandTimeoutMs() {
    return this.env.REDIS_COMMAND_TIMEOUT_MS;
  }

  get redisPassword() {
    return this.env.REDIS_PASSWORD;
  }

  get jwtSecret() {
    return this.env.JWT_SECRET;
  }

  get jwtSecretKid() {
    return this.env.JWT_SECRET_KID;
  }

  get jwtSecretByKid() {
    return this.parseSecretMap(this.env.JWT_SECRET_ROTATION, this.env.JWT_SECRET_KID, this.env.JWT_SECRET);
  }

  get jwtRefreshSecretKid() {
    return this.env.JWT_REFRESH_SECRET_KID;
  }

  get jwtRefreshTtlSeconds() {
    return this.env.JWT_REFRESH_TTL_SECONDS;
  }

  get jwtRefreshSecretByKid() {
    return this.parseSecretMap(
      this.env.JWT_REFRESH_SECRET_ROTATION,
      this.env.JWT_REFRESH_SECRET_KID,
      this.env.JWT_REFRESH_SECRET,
    );
  }

  get jwtIssuer() {
    return this.env.JWT_ISSUER;
  }

  get jwtAudience() {
    return this.env.JWT_AUDIENCE;
  }

  get jwtAccessTtlSeconds() {
    return this.env.JWT_ACCESS_TTL_SECONDS;
  }

  get jwtPreviousSecret() {
    return this.env.JWT_PREVIOUS_SECRET;
  }

  get jwtRefreshTtlSeconds() {
    return this.env.JWT_REFRESH_TTL_SECONDS;
  }

  get apiKeyPrefix() {
    return this.env.API_KEY_PREFIX;
  }

  get webhookTimestampToleranceSeconds() {
    return this.env.WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS;
  }

  get webhookNonceTtlSeconds() {
    return this.env.WEBHOOK_NONCE_TTL_SECONDS;
  }

  get apiKeyHashSecret() {
    return this.env.API_KEY_HASH_SECRET;
  }

  get apiKeyPrefix() {
    return this.env.API_KEY_PREFIX;
  }

  get smsProvider() {
    return this.env.SMS_PROVIDER;
  }

  get clickMerchantId() {
    return this.env.CLICK_MERCHANT_ID;
  }

  get clickSecretKey() {
    return this.env.CLICK_SECRET_KEY;
  }

  get paymeMerchantId() {
    return this.env.PAYME_MERCHANT_ID;
  }

  get paymeSecretKey() {
    return this.env.PAYME_SECRET_KEY;
  }

  get paymentReturnUrl() {
    return this.env.PAYMENT_RETURN_URL;
  }

  get logLevel() {
    return this.env.LOG_LEVEL;
  }

  get otelEnabled() {
    return this.env.OTEL_ENABLED === 'true';
  }

  get otelServiceName() {
    return this.env.OTEL_SERVICE_NAME;
  }

  get otelExporterOtlpEndpoint() {
    return this.env.OTEL_EXPORTER_OTLP_ENDPOINT;
  }

  get webhookMaxDriftSeconds() {
    return this.env.WEBHOOK_MAX_DRIFT_SECONDS;
  }

  get webhookNonceTtlSeconds() {
    return this.env.WEBHOOK_NONCE_TTL_SECONDS;
  }
}
