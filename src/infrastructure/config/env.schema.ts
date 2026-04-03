export interface AppEnv {
  NODE_ENV: 'development' | 'test' | 'staging' | 'production';
  PORT: number;
  DATABASE_URL: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD?: string;
  REDIS_COMMAND_TIMEOUT_MS: number;
  JWT_SECRET: string;
  JWT_ISSUER: string;
  JWT_AUDIENCE: string;
  JWT_ACCESS_TTL_SECONDS: number;
  JWT_REFRESH_TTL_SECONDS: number;
  JWT_KEY_ID: string;
  JWT_PUBLIC_KEY?: string;
  API_KEY_HASH_SECRET: string;
  API_KEY_PREFIX: string;
  SMS_PROVIDER: string;
  CLICK_MERCHANT_ID: string;
  CLICK_SECRET_KEY: string;
  PAYME_MERCHANT_ID: string;
  PAYME_SECRET_KEY: string;
  PAYMENT_RETURN_URL: string;
  WEBHOOK_MAX_DRIFT_SECONDS: number;
  WEBHOOK_NONCE_TTL_SECONDS: number;
  DEFAULT_DAILY_SPEND_LIMIT: number;
  ALLOWED_SMS_COUNTRIES: string[];
  OTEL_EXPORTER_OTLP_ENDPOINT?: string;
  OTEL_SERVICE_NAME: string;
  PROMETHEUS_ENABLED: boolean;
}

function requiredString(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function numberValue(name: string, fallback?: number): number {
  const raw = process.env[name] ?? (fallback !== undefined ? String(fallback) : undefined);
  if (raw === undefined) throw new Error(`Missing required environment variable: ${name}`);
  const value = Number(raw);
  if (!Number.isFinite(value)) throw new Error(`Invalid numeric environment variable: ${name}`);
  return value;
}

function optionalString(name: string): string | undefined {
  const value = process.env[name];
  if (!value || value.trim().length === 0) return undefined;
  return value;
}

export function parseEnv(): AppEnv {
  const nodeEnv = (process.env.NODE_ENV ?? 'development') as AppEnv['NODE_ENV'];
  if (!['development', 'test', 'staging', 'production'].includes(nodeEnv)) {
    throw new Error('NODE_ENV must be one of development, test, staging, production');
  }

  return {
    NODE_ENV: nodeEnv,
    PORT: numberValue('PORT', 3000),
    DATABASE_URL: requiredString('DATABASE_URL'),
    REDIS_HOST: requiredString('REDIS_HOST'),
    REDIS_PORT: numberValue('REDIS_PORT', 6379),
    REDIS_PASSWORD: optionalString('REDIS_PASSWORD'),
    REDIS_COMMAND_TIMEOUT_MS: numberValue('REDIS_COMMAND_TIMEOUT_MS', 5000),
    JWT_SECRET: requiredString('JWT_SECRET'),
    JWT_ISSUER: requiredString('JWT_ISSUER'),
    JWT_AUDIENCE: requiredString('JWT_AUDIENCE'),
    JWT_ACCESS_TTL_SECONDS: numberValue('JWT_ACCESS_TTL_SECONDS', 900),
    JWT_REFRESH_TTL_SECONDS: numberValue('JWT_REFRESH_TTL_SECONDS', 2592000),
    JWT_KEY_ID: requiredString('JWT_KEY_ID', 'primary-v1'),
    JWT_PUBLIC_KEY: optionalString('JWT_PUBLIC_KEY'),
    API_KEY_HASH_SECRET: requiredString('API_KEY_HASH_SECRET'),
    API_KEY_PREFIX: requiredString('API_KEY_PREFIX', 'sms_live_'),
    SMS_PROVIDER: requiredString('SMS_PROVIDER', 'mock'),
    CLICK_MERCHANT_ID: requiredString('CLICK_MERCHANT_ID'),
    CLICK_SECRET_KEY: requiredString('CLICK_SECRET_KEY'),
    PAYME_MERCHANT_ID: requiredString('PAYME_MERCHANT_ID'),
    PAYME_SECRET_KEY: requiredString('PAYME_SECRET_KEY'),
    PAYMENT_RETURN_URL: requiredString('PAYMENT_RETURN_URL'),
    WEBHOOK_MAX_DRIFT_SECONDS: numberValue('WEBHOOK_MAX_DRIFT_SECONDS', 300),
    WEBHOOK_NONCE_TTL_SECONDS: numberValue('WEBHOOK_NONCE_TTL_SECONDS', 3600),
    DEFAULT_DAILY_SPEND_LIMIT: numberValue('DEFAULT_DAILY_SPEND_LIMIT', 500),
    ALLOWED_SMS_COUNTRIES: (process.env.ALLOWED_SMS_COUNTRIES ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
    OTEL_EXPORTER_OTLP_ENDPOINT: optionalString('OTEL_EXPORTER_OTLP_ENDPOINT'),
    OTEL_SERVICE_NAME: requiredString('OTEL_SERVICE_NAME', 'sms-sending-api'),
    PROMETHEUS_ENABLED: (process.env.PROMETHEUS_ENABLED ?? 'true') === 'true',
  };
}
