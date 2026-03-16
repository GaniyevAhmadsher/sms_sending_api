import { Global, Module } from '@nestjs/common';
import { QueueConnectionService } from './queue-connection.service';

@Global()
@Module({
  providers: [QueueConnectionService],
  exports: [QueueConnectionService],
})
export class QueueConnectionModule {}
