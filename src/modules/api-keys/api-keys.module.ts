import { Module } from '@nestjs/common';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeysService } from './api-keys.service';
import { ApiKeyGuard } from './guards/api-key.guard';
import { ApiKeyRateLimitGuard } from './guards/api-key-rate-limit.guard';

@Module({
  controllers: [ApiKeysController],
  providers: [ApiKeysService, ApiKeyGuard, ApiKeyRateLimitGuard],
  exports: [ApiKeysService, ApiKeyGuard, ApiKeyRateLimitGuard],
})
export class ApiKeysModule {}
