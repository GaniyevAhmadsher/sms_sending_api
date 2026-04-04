export interface EnvSchema {
  NODE_ENV: 'development' | 'test' | 'staging' | 'production';
  PORT: number;
  DATABASE_URL: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD?: string;
  REDIS_COMMAND_TIMEOUT_MS: number;
  JWT_SECRET: string;
  JWT_PREVIOUS_SECRET?: string;
  JWT_ISSUER: string;
  JWT_AUDIENCE: string;
  JWT_ACCESS_TTL_SECONDS: number;
  JWT_REFRESH_TTL_SECONDS: number;
  API_KEY_HASH_SECRET: string;
  API_KEY_PREFIX: string;
  WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS: number;
  WEBHOOK_NONCE_TTL_SECONDS: number;
  SMS_PROVIDER: string;
  CLICK_MERCHANT_ID: string;
  CLICK_SECRET_KEY: string;
  PAYME_MERCHANT_ID: string;
  PAYME_SECRET_KEY: string;
  PAYMENT_RETURN_URL: string;
  LOG_LEVEL: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
  OTEL_ENABLED: 'true' | 'false';
  OTEL_SERVICE_NAME: string;
  OTEL_EXPORTER_OTLP_ENDPOINT?: string;
}

function req(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function num(name: string, fallback?: number): number {
  const raw = process.env[name] ?? String(fallback ?? '');
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new Error(`Invalid numeric environment variable: ${name}`);
  return value;
}

export function parseEnv(): EnvSchema {
  const nodeEnv = (process.env.NODE_ENV ?? 'development') as EnvSchema['NODE_ENV'];
  const logLevel = (process.env.LOG_LEVEL ?? 'info') as EnvSchema['LOG_LEVEL'];

  const env: EnvSchema = {
    NODE_ENV: nodeEnv,
    PORT: num('PORT', 3000),
    DATABASE_URL: req('DATABASE_URL'),
    REDIS_HOST: req('REDIS_HOST'),
    REDIS_PORT: num('REDIS_PORT', 6379),
    REDIS_PASSWORD: process.env.REDIS_PASSWORD,
    REDIS_COMMAND_TIMEOUT_MS: num('REDIS_COMMAND_TIMEOUT_MS', 2000),
    JWT_SECRET: req('JWT_SECRET'),
    JWT_PREVIOUS_SECRET: process.env.JWT_PREVIOUS_SECRET,
    JWT_ISSUER: req('JWT_ISSUER'),
    JWT_AUDIENCE: req('JWT_AUDIENCE'),
    JWT_ACCESS_TTL_SECONDS: num('JWT_ACCESS_TTL_SECONDS', 900),
    JWT_REFRESH_TTL_SECONDS: num('JWT_REFRESH_TTL_SECONDS', 2592000),
    API_KEY_HASH_SECRET: req('API_KEY_HASH_SECRET'),
    API_KEY_PREFIX: process.env.API_KEY_PREFIX ?? 'sms_live_',
    WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS: num('WEBHOOK_TIMESTAMP_TOLERANCE_SECONDS', 300),
    WEBHOOK_NONCE_TTL_SECONDS: num('WEBHOOK_NONCE_TTL_SECONDS', 600),
    SMS_PROVIDER: req('SMS_PROVIDER'),
    CLICK_MERCHANT_ID: req('CLICK_MERCHANT_ID'),
    CLICK_SECRET_KEY: req('CLICK_SECRET_KEY'),
    PAYME_MERCHANT_ID: req('PAYME_MERCHANT_ID'),
    PAYME_SECRET_KEY: req('PAYME_SECRET_KEY'),
    PAYMENT_RETURN_URL: req('PAYMENT_RETURN_URL'),
    LOG_LEVEL: logLevel,
    OTEL_ENABLED: process.env.OTEL_ENABLED === 'true' ? 'true' : 'false',
    OTEL_SERVICE_NAME: process.env.OTEL_SERVICE_NAME ?? 'sms-sending-api',
    OTEL_EXPORTER_OTLP_ENDPOINT: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
  };

  if (!['development', 'test', 'staging', 'production'].includes(env.NODE_ENV)) {
    throw new Error(`Invalid NODE_ENV: ${env.NODE_ENV}`);
  }

  if (!['fatal', 'error', 'warn', 'info', 'debug', 'trace'].includes(env.LOG_LEVEL)) {
    throw new Error(`Invalid LOG_LEVEL: ${env.LOG_LEVEL}`);
  }

  if (env.JWT_SECRET.length < 32 || env.API_KEY_HASH_SECRET.length < 32) {
    throw new Error('JWT_SECRET and API_KEY_HASH_SECRET must be at least 32 chars long');
  }

  if (!/^sms_(live|test)_/.test(env.API_KEY_PREFIX)) {
    throw new Error('API_KEY_PREFIX must start with sms_live_ or sms_test_');
  }

  return env;
}
