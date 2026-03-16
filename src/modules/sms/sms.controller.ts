import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { SmsService } from './sms.service';
import { SendSmsDto } from './dto/send-sms.dto';
import { ApiKeyGuard } from '../api-keys/guards/api-key.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-request.interface';
import { ApiKeyRateLimitGuard } from '../api-keys/guards/api-key-rate-limit.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('sms')
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Post('send')
  @UseGuards(ApiKeyGuard, ApiKeyRateLimitGuard)
  send(@CurrentUser() user: AuthenticatedUser, @Body() dto: SendSmsDto) {
    return this.smsService.send(user, dto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  status(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.smsService.getStatus(user.id, id);
  }

  @Patch(':id/delivered')
  @UseGuards(JwtAuthGuard)
  markDelivered(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.smsService.markDelivered(user.id, id);
  }
}
