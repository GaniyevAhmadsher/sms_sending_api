import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppConfigService } from './infrastructure/config/app-config.service';
import { PinoLoggerService } from './infrastructure/logging/pino-logger.service';
import { startTracing } from './infrastructure/tracing/tracing';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = app.get(AppConfigService);
  if (config.otelEnabled) {
    await startTracing(config.otelServiceName, config.otelExporterOtlpEndpoint);
  }

  app.useLogger(app.get(PinoLoggerService));
  await app.listen(config.port);
}

void bootstrap();
