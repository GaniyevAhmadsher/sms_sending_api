import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-request.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.paymentsService.create(
      user.id,
      Number(dto.amount),
      dto.provider,
    );
  }

  @Post('webhook/click')
  webhookClick(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() body: any,
  ) {
    return this.paymentsService.handleClickWebhook(headers, body);
  }

  @Post('webhook/payme')
  webhookPayme(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() body: any,
  ) {
    return this.paymentsService.handlePaymeWebhook(headers, body);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  history(@CurrentUser() user: AuthenticatedUser, @Req() req: Request) {
    void req;
    return this.paymentsService.history(user.id);
  }
}
