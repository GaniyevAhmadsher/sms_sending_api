import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-request.interface';
import { ApiKeyGuard } from '../api-keys/guards/api-key.guard';
import { ApiKeyRateLimitGuard } from '../api-keys/guards/api-key-rate-limit.guard';
import { SendSmsDto } from './dto/send-sms.dto';
import { SmsService } from './sms.service';

@Controller('sms')
@UseGuards(ApiKeyGuard, ApiKeyRateLimitGuard)
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Post('send')
  send(@CurrentUser() user: AuthenticatedUser, @Body() dto: SendSmsDto) {
    return this.smsService.send(user.id, dto, user.apiKeyId);
  }
}
