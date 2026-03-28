import { Body, Controller, Get, Headers, Post, Req, UseGuards } from '@nestjs/common';
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
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(user.id, Number(dto.amount), dto.provider);
  }

  @Post('webhook/click')
  async webhookClick(@Headers() headers: Record<string, string | string[] | undefined>, @Body() body: any) {
    await this.paymentsService.ingestWebhook('CLICK', headers, body);
    return { ok: true };
  }

  @Post('webhook/payme')
  async webhookPayme(@Headers() headers: Record<string, string | string[] | undefined>, @Body() body: any) {
    await this.paymentsService.ingestWebhook('PAYME', headers, body);
    return { ok: true };
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  history(@CurrentUser() user: AuthenticatedUser, @Req() req: Request) {
    void req;
    return this.paymentsService.history(user.id);
  }
}
