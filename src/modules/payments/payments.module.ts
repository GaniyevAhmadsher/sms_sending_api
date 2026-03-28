import { Module, forwardRef } from '@nestjs/common';
import { BillingModule } from '../billing/billing.module';
import { QueueModule } from '../queue/queue.module';
import { ClickProvider } from './providers/click.provider';
import { PAYMENT_PROVIDERS } from './providers/payment.constants';
import { PaymeProvider } from './providers/payme.provider';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [BillingModule, forwardRef(() => QueueModule)],
  controllers: [PaymentsController],
  providers: [
    ClickProvider,
    PaymeProvider,
    {
      provide: PAYMENT_PROVIDERS,
      useFactory: (clickProvider: ClickProvider, paymeProvider: PaymeProvider) => [clickProvider, paymeProvider],
      inject: [ClickProvider, PaymeProvider],
    },
    PaymentsService,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
