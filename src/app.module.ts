import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ApiKeysModule } from './modules/api-keys/api-keys.module';
import { SmsModule } from './modules/sms/sms.module';
import { QueueModule } from './modules/queue/queue.module';
import { ProvidersModule } from './modules/providers/providers.module';
import { BillingModule } from './modules/billing/billing.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ConfigModule } from './infrastructure/config/config.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { RateLimitModule } from './infrastructure/rate-limit/rate-limit.module';
import { GlobalThrottleGuard } from './infrastructure/rate-limit/global-throttle.guard';
import { QueueConnectionModule } from './infrastructure/queue/queue-connection.module';
import { HealthModule } from './modules/health/health.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { RequestLoggingMiddleware } from './infrastructure/logging/request-logging.middleware';
import { ObservabilityModule } from './infrastructure/observability/observability.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    RedisModule,
    RateLimitModule,
    QueueConnectionModule,
    AuthModule,
    UsersModule,
    ApiKeysModule,
    ProvidersModule,
    QueueModule,
    BillingModule,
    SmsModule,
    AnalyticsModule,
    HealthModule,
    PaymentsModule,
    ObservabilityModule,
    OnboardingModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: GlobalThrottleGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggingMiddleware).forRoutes('*');
  }
}
