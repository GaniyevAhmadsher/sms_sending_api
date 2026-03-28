import { Global, Module, OnModuleInit } from '@nestjs/common';
import { AppConfigService } from './app-config.service';

@Global()
@Module({
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class ConfigModule implements OnModuleInit {
  constructor(private readonly config: AppConfigService) {}

  onModuleInit() {
    this.config.validate();
  }
}
